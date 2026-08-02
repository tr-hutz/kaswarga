/*
 * =============================================================================
 * 019_FIX_EXPENSE_APPROVAL_LEDGER
 *
 * The same auth.uid()-in-security-definer problem that broke approve_confirmation
 * (fixed in 017) also affects approve_expense and reject_expense.
 *
 * Migration 014 replaced the expenses UPDATE and ledger INSERT RLS policies
 * with has_permission() calls, which call auth.uid() internally. When the
 * approve/reject functions are invoked via supabaseAdmin.rpc() (service_role
 * JWT), auth.uid() returns NULL. If the function's security context does not
 * properly run as the postgres superuser (e.g., wrong ownership in the DB),
 * those RLS checks are evaluated with auth.uid() = NULL → false → exception
 * → rollback → neither the status change nor the ledger entry is committed.
 *
 * This migration:
 *   1. Re-creates insert_ledger as SECURITY DEFINER so that the ledger INSERT
 *      always runs as the postgres superuser, bypassing all RLS policies
 *      unconditionally, regardless of the calling security context.
 *   2. Re-creates approve_expense and reject_expense as SECURITY DEFINER with
 *      explicit service_role grants, matching the pattern of approve_confirmation
 *      in migration 017. This guarantees the functions are owned by postgres
 *      (superuser) and their entire execution context bypasses RLS.
 *
 * The notification INSERT is intentionally omitted here — that responsibility
 * was moved to the server-side API routes in migration 018.
 *
 * Dependencies : 005_functions, 014_rbac_rls, 018_move_expense_notification_to_api
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * 1. insert_ledger — add SECURITY DEFINER
 *    Ensures the ledger INSERT always runs as postgres (superuser),
 *    bypassing all RLS policies on the ledger table unconditionally.
 * --------------------------------------------------------------------------- */

CREATE OR REPLACE FUNCTION insert_ledger(
    p_rt_id        uuid,
    p_type         varchar,
    p_source       varchar,
    p_reference_id uuid,
    p_date         timestamptz,
    p_description  text,
    p_amount       bigint,
    p_created_by   uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_last_balance bigint;
    v_new_balance  bigint;
    v_id           uuid;
BEGIN
    v_last_balance := get_last_balance(p_rt_id);

    IF p_type = 'pemasukan' THEN
        v_new_balance := v_last_balance + p_amount;
    ELSE
        v_new_balance := v_last_balance - p_amount;
    END IF;

    INSERT INTO ledger (
        rt_id,
        type,
        source,
        reference_id,
        date,
        description,
        amount,
        balance_after,
        created_by
    ) VALUES (
        p_rt_id,
        p_type,
        p_source,
        p_reference_id,
        p_date,
        p_description,
        p_amount,
        v_new_balance,
        p_created_by
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

REVOKE ALL     ON FUNCTION insert_ledger(uuid, varchar, varchar, uuid, timestamptz, text, bigint, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION insert_ledger(uuid, varchar, varchar, uuid, timestamptz, text, bigint, uuid) TO service_role;


/* ----------------------------------------------------------------------------
 * 2. approve_expense — re-create to guarantee postgres ownership + SD
 *    Notification is handled by app/api/expenses/approve/route.ts (migration 018).
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
    -- Notification is sent by app/api/expenses/approve/route.ts
END;
$$;

REVOKE ALL     ON FUNCTION approve_expense(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION approve_expense(uuid, uuid) TO authenticated;
GRANT  EXECUTE ON FUNCTION approve_expense(uuid, uuid) TO service_role;


/* ----------------------------------------------------------------------------
 * 3. reject_expense — re-create to guarantee postgres ownership + SD
 *    Notification is handled by app/api/expenses/reject/route.ts (migration 018).
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
    -- Notification is sent by app/api/expenses/reject/route.ts
END;
$$;

REVOKE ALL     ON FUNCTION reject_expense(uuid, text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION reject_expense(uuid, text, uuid) TO authenticated;
GRANT  EXECUTE ON FUNCTION reject_expense(uuid, text, uuid) TO service_role;
