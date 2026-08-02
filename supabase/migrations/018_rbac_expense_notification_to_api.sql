/*
 * =============================================================================
 * 018_MOVE_EXPENSE_NOTIFICATION_TO_API
 *
 * The approve_expense / reject_expense functions previously inserted
 * notifications from inside the security-definer context (running as postgres).
 * Supabase Realtime's row-level security check runs against the subscriber's
 * JWT and may not reliably deliver events that originate from the postgres
 * superuser role on some Supabase plan tiers.
 *
 * This migration re-creates both functions without the notification INSERT.
 * Notification delivery is now handled by the server-side API routes
 * (app/api/expenses/approve and app/api/expenses/reject) using supabaseAdmin,
 * which inserts with the service_role and guarantees the WAL event is emitted
 * with a proper row identity for Realtime RLS filtering.
 *
 * Dependencies : 005_functions
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * approve_expense — remove notification INSERT
 * --------------------------------------------------------------------------- */

CREATE OR REPLACE FUNCTION approve_expense(
    p_id      uuid,
    p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_row record;
BEGIN
    -- 1. Lock row
    SELECT * INTO v_row
    FROM   expenses
    WHERE  id = p_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pengeluaran tidak ditemukan'
            USING errcode = 'KW020';
    END IF;

    -- 2. Status check
    IF v_row.status != 'pending' THEN
        RAISE EXCEPTION 'Pengeluaran sudah diproses'
            USING errcode = 'KW021';
    END IF;

    -- 3. Mark approved
    UPDATE expenses
    SET    status      = 'approved',
           approved_by = p_user_id,
           approved_at = now()
    WHERE  id = p_id;

    -- 4. Ledger debit entry
    PERFORM insert_ledger(
        v_row.rt_id,
        'pengeluaran',
        'pengeluaran',
        p_id,
        now(),
        COALESCE(v_row.description, 'Pengeluaran RT'),
        v_row.amount::bigint,
        p_user_id
    );
    -- Notification is sent by the API route (app/api/expenses/approve/route.ts)
END;
$$;

REVOKE ALL     ON FUNCTION approve_expense(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION approve_expense(uuid, uuid) TO authenticated;
GRANT  EXECUTE ON FUNCTION approve_expense(uuid, uuid) TO service_role;


/* ----------------------------------------------------------------------------
 * reject_expense — remove notification INSERT
 * --------------------------------------------------------------------------- */

CREATE OR REPLACE FUNCTION reject_expense(
    p_id      uuid,
    p_reason  text,
    p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_row record;
BEGIN
    -- 1. Lock row
    SELECT * INTO v_row
    FROM   expenses
    WHERE  id = p_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pengeluaran tidak ditemukan'
            USING errcode = 'KW020';
    END IF;

    -- 2. Status check
    IF v_row.status != 'pending' THEN
        RAISE EXCEPTION 'Pengeluaran sudah diproses'
            USING errcode = 'KW021';
    END IF;

    -- 3. Mark rejected
    UPDATE expenses
    SET    status         = 'rejected',
           approved_by    = p_user_id,
           rejection_note = p_reason
    WHERE  id = p_id;
    -- Notification is sent by the API route (app/api/expenses/reject/route.ts)
END;
$$;

REVOKE ALL     ON FUNCTION reject_expense(uuid, text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION reject_expense(uuid, text, uuid) TO authenticated;
GRANT  EXECUTE ON FUNCTION reject_expense(uuid, text, uuid) TO service_role;
