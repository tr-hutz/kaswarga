/*
 * =============================================================================
 * 017_FIX_PAYMENT_APPROVAL_RBAC
 *
 * The original approve_confirmation / reject_confirmation functions hard-coded
 * a role check ("caller must be TREASURER"). RBAC v2 grants payment.approve
 * and payment.reject to multiple roles (e.g. RT_ADMIN also holds both).
 *
 * This migration:
 *   1. Adds helper function user_has_permission(user_id, rt_id, code) that
 *      performs the same RBAC v2 logic as has_permission() but accepts an
 *      explicit user_id instead of auth.uid(), making it safe to call from
 *      security-definer functions invoked via the service-role key (where
 *      auth.uid() is NULL).
 *   2. Re-creates approve_confirmation replacing the hard-coded TREASURER
 *      guard with a RBAC v2 permission check for 'payment.approve'.
 *   3. Re-creates reject_confirmation replacing the hard-coded TREASURER
 *      guard with a RBAC v2 permission check for 'payment.reject'.
 *
 * Dependencies : 011–016
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * 1. user_has_permission
 *    Same logic as has_permission() but takes an explicit p_user_id so it can
 *    be called from security-definer contexts where auth.uid() is NULL.
 * --------------------------------------------------------------------------- */

CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id        uuid,
    p_rt_id          uuid,
    p_permission_code text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT
        -- SUPER_ADMIN: platform bypass, not bound to any RT
        EXISTS (
            SELECT 1
            FROM   memberships
            WHERE  user_id = p_user_id
            AND    role    = 'SUPER_ADMIN'
        )
        OR
        -- Effective permission: RT override > role default > deny
        EXISTS (
            SELECT 1
            FROM   memberships                m
            JOIN   roles                      r
                ON r.code = CASE m.role::text
                                WHEN 'CHAIR' THEN 'RT_CHAIR'
                                WHEN 'ADMIN' THEN 'RT_ADMIN'
                                ELSE m.role::text
                            END
            JOIN   permissions                p  ON p.code = p_permission_code
            LEFT JOIN role_permissions        rp ON  rp.role_id       = r.id
                                                 AND rp.permission_id = p.id
            LEFT JOIN rt_permission_overrides ov ON  ov.rt_id         = p_rt_id
                                                 AND ov.role_id       = r.id
                                                 AND ov.permission_id = p.id
            WHERE  m.user_id = p_user_id
            AND    m.rt_id   = p_rt_id
            AND    m.status  = 'active'
            AND    COALESCE(ov.allow, rp.allow, false) = true
        )
$$;

REVOKE ALL     ON FUNCTION user_has_permission(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION user_has_permission(uuid, uuid, text) TO authenticated;
GRANT  EXECUTE ON FUNCTION user_has_permission(uuid, uuid, text) TO service_role;


/* ----------------------------------------------------------------------------
 * 2. approve_confirmation — replace hardcoded TREASURER guard with RBAC v2
 * --------------------------------------------------------------------------- */

CREATE OR REPLACE FUNCTION approve_confirmation(
    p_confirmation_id uuid,
    p_user_id         uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_confirmation   record;
    v_member         record;
    v_payment_id     uuid;
    v_monthly_fee    bigint;
    v_month_count    integer;
    v_expected_total bigint;
    v_month_str      text;
    v_month_names    text[] := array[
        'Januari', 'Februari', 'Maret',    'April',   'Mei',      'Juni',
        'Juli',    'Agustus',  'September', 'Oktober', 'November', 'Desember'
    ];
BEGIN
    -- 0. Permission check: caller must have payment.approve for this RT
    IF NOT EXISTS (
        SELECT 1 FROM payment_confirmations WHERE id = p_confirmation_id
    ) THEN
        RAISE EXCEPTION 'Konfirmasi pembayaran tidak ditemukan'
            USING errcode = 'KW001';
    END IF;

    IF NOT user_has_permission(
        p_user_id,
        (SELECT rt_id FROM payment_confirmations WHERE id = p_confirmation_id),
        'payment.approve'
    ) THEN
        RAISE EXCEPTION 'Tidak memiliki izin untuk menyetujui konfirmasi pembayaran'
            USING errcode = 'KW401';
    END IF;

    -- 1. Lock row
    SELECT *
    INTO   v_confirmation
    FROM   payment_confirmations
    WHERE  id = p_confirmation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Konfirmasi pembayaran tidak ditemukan'
            USING errcode = 'KW001';
    END IF;

    -- 2. Status check
    IF v_confirmation.status != 'pending' THEN
        RAISE EXCEPTION 'Konfirmasi sudah diproses'
            USING errcode = 'KW002';
    END IF;

    -- Fetch the resident's membership scoped to this RT
    SELECT * INTO v_member
    FROM   memberships
    WHERE  resident_id = v_confirmation.resident_id
    AND    rt_id       = v_confirmation.rt_id;

    -- 3. Duplicate month check
    IF EXISTS (
        SELECT 1
        FROM   payment_details      pd
        JOIN   confirmation_details cd ON cd.confirmation_id = p_confirmation_id
        WHERE  pd.resident_id = v_confirmation.resident_id
        AND    pd.year        = v_confirmation.year
        AND    pd.month       = cd.month
    ) THEN
        RAISE EXCEPTION 'Beberapa bulan yang dikonfirmasi sudah memiliki data pembayaran yang disetujui'
            USING errcode = 'KW003';
    END IF;

    -- 4. Total validation
    SELECT monthly_fee INTO v_monthly_fee FROM rt WHERE id = v_confirmation.rt_id;

    SELECT count(*) INTO v_month_count
    FROM   confirmation_details
    WHERE  confirmation_id = p_confirmation_id;

    v_expected_total := v_monthly_fee * v_month_count;

    IF v_confirmation.total_amount > v_expected_total THEN
        RAISE EXCEPTION 'Total pembayaran (%) melebihi jumlah yang seharusnya (% x % bulan = %). Selisih: %',
            v_confirmation.total_amount, v_monthly_fee, v_month_count, v_expected_total,
            (v_confirmation.total_amount - v_expected_total)
            USING errcode = 'KW004';
    END IF;

    IF v_confirmation.total_amount < v_expected_total THEN
        RAISE EXCEPTION 'Total pembayaran (%) kurang dari jumlah yang seharusnya (% x % bulan = %). Selisih: %',
            v_confirmation.total_amount, v_monthly_fee, v_month_count, v_expected_total,
            (v_expected_total - v_confirmation.total_amount)
            USING errcode = 'KW005';
    END IF;

    -- 5. Insert payment header
    INSERT INTO payments (resident_id, rt_id, year, total_amount, date, created_at)
    VALUES (v_confirmation.resident_id, v_confirmation.rt_id, v_confirmation.year,
            v_confirmation.total_amount, now(), now())
    RETURNING id INTO v_payment_id;

    -- 6. Copy monthly detail
    INSERT INTO payment_details (payment_id, resident_id, year, month, amount, created_at)
    SELECT v_payment_id, d.resident_id, d.year, d.month, d.amount, now()
    FROM   confirmation_details d
    WHERE  d.confirmation_id = p_confirmation_id;

    -- 7. Mark approved
    UPDATE payment_confirmations
    SET    status      = 'approved',
           approved_at = now()
    WHERE  id = p_confirmation_id;

    -- 8. Ledger entry
    PERFORM insert_ledger(
        v_confirmation.rt_id,
        'pemasukan',
        'pembayaran',
        v_payment_id,
        now(),
        'Pembayaran iuran warga',
        v_confirmation.total_amount,
        p_user_id
    );

    -- 9. Notify resident
    SELECT string_agg(v_month_names[month], ', ' ORDER BY month)
    INTO   v_month_str
    FROM   confirmation_details
    WHERE  confirmation_id = p_confirmation_id;

    INSERT INTO notifications (
        rt_id, type, title, message, entity_type, entity_id, target_user_id
    ) VALUES (
        v_confirmation.rt_id,
        'payment_approved',
        'Pembayaran Disetujui',
        'Pembayaran iuran ' || v_month_str || ' ' || v_confirmation.year || ' telah disetujui',
        'payment_confirmations',
        v_confirmation.id,
        v_member.user_id
    );
END;
$$;


/* ----------------------------------------------------------------------------
 * 3. reject_confirmation — replace hardcoded TREASURER guard with RBAC v2
 * --------------------------------------------------------------------------- */

CREATE OR REPLACE FUNCTION reject_confirmation(
    p_confirmation_id uuid,
    p_reason          text,
    p_user_id         uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_confirmation record;
    v_member       record;
    v_month_str    text;
    v_month_names  text[] := array[
        'Januari', 'Februari', 'Maret',    'April',   'Mei',      'Juni',
        'Juli',    'Agustus',  'September', 'Oktober', 'November', 'Desember'
    ];
BEGIN
    -- 0. Permission check: caller must have payment.reject for this RT
    IF NOT EXISTS (
        SELECT 1 FROM payment_confirmations WHERE id = p_confirmation_id
    ) THEN
        RAISE EXCEPTION 'Konfirmasi pembayaran tidak ditemukan'
            USING errcode = 'KW001';
    END IF;

    IF NOT user_has_permission(
        p_user_id,
        (SELECT rt_id FROM payment_confirmations WHERE id = p_confirmation_id),
        'payment.reject'
    ) THEN
        RAISE EXCEPTION 'Tidak memiliki izin untuk menolak konfirmasi pembayaran'
            USING errcode = 'KW401';
    END IF;

    -- 1. Lock row
    SELECT * INTO v_confirmation
    FROM   payment_confirmations
    WHERE  id = p_confirmation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Konfirmasi pembayaran tidak ditemukan'
            USING errcode = 'KW001';
    END IF;

    -- 2. Status check
    IF v_confirmation.status != 'pending' THEN
        RAISE EXCEPTION 'Konfirmasi sudah diproses'
            USING errcode = 'KW002';
    END IF;

    -- Fetch the resident's membership scoped to this RT.
    SELECT * INTO v_member
    FROM   memberships
    WHERE  resident_id = v_confirmation.resident_id
    AND    rt_id       = v_confirmation.rt_id;

    -- 3. Mark rejected
    UPDATE payment_confirmations
    SET    status           = 'rejected',
           rejected_at      = now(),
           rejection_reason = p_reason
    WHERE  id = p_confirmation_id;

    -- 4. Notify resident
    SELECT string_agg(v_month_names[month], ', ' ORDER BY month)
    INTO   v_month_str
    FROM   confirmation_details
    WHERE  confirmation_id = p_confirmation_id;

    INSERT INTO notifications (
        rt_id, type, title, message, entity_type, entity_id, target_user_id
    ) VALUES (
        v_confirmation.rt_id,
        'payment_rejected',
        'Pembayaran Ditolak',
        'Pembayaran iuran ' || v_month_str || ' ' || v_confirmation.year || ' ditolak' ||
            CASE WHEN p_reason IS NOT NULL AND p_reason != ''
                 THEN '. Alasan: ' || p_reason
                 ELSE ''
            END,
        'payment_confirmations',
        v_confirmation.id,
        v_member.user_id
    );
END;
$$;


/* ----------------------------------------------------------------------------
 * Grants — keep the same access model as the original functions
 * --------------------------------------------------------------------------- */

REVOKE ALL     ON FUNCTION approve_confirmation(uuid, uuid)      FROM PUBLIC;
REVOKE ALL     ON FUNCTION reject_confirmation(uuid, text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION approve_confirmation(uuid, uuid)      TO authenticated;
GRANT  EXECUTE ON FUNCTION reject_confirmation(uuid, text, uuid) TO authenticated;
