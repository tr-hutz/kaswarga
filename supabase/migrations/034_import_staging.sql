/*
 * =============================================================================
 * 034_IMPORT_STAGING
 *
 * Enhances the Shared Import Framework with a Treasurer Confirmation step
 * that separates validation from promotion.
 *
 * New lifecycle:
 *   QUEUED → PROCESSING → VALIDATING → STAGED
 *     Treasurer Confirms → PROMOTING → PROMOTED → PENDING_APPROVAL
 *       PIC Approves  → COMPLETED
 *       PIC Rejects   → REJECTED
 *     Treasurer Cancels → CANCELLED
 *
 * Changes:
 *   1. New import_status enum values: STAGED, PROMOTING, PROMOTED, CANCELLED
 *   2. confirmed_by / confirmed_at columns on import_jobs
 *   3. import_job_id on expenses (batch approval linkage)
 *   4. import_job_id on income_transactions (provenance)
 *   5. approve_expenses_by_import_job() RPC (batch ledger approval)
 *   6. reject_expenses_by_import_job()  RPC (batch rejection)
 *
 * Dependencies: 031_import_jobs, 019_fix_expense_approval_ledger
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * 1. New import_status enum values
 * --------------------------------------------------------------------------- */

ALTER TYPE import_status ADD VALUE IF NOT EXISTS 'STAGED';
ALTER TYPE import_status ADD VALUE IF NOT EXISTS 'PROMOTING';
ALTER TYPE import_status ADD VALUE IF NOT EXISTS 'PROMOTED';
ALTER TYPE import_status ADD VALUE IF NOT EXISTS 'CANCELLED';


/* ----------------------------------------------------------------------------
 * 2. Treasurer confirmation columns on import_jobs
 * --------------------------------------------------------------------------- */

ALTER TABLE import_jobs
    ADD COLUMN IF NOT EXISTS confirmed_by uuid REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;


/* ----------------------------------------------------------------------------
 * 3. import_job_id on expenses
 *    Links an expense to the import batch that created it.
 *    NULL for manually created expenses.
 * --------------------------------------------------------------------------- */

ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS import_job_id uuid REFERENCES import_jobs(id);

CREATE INDEX IF NOT EXISTS idx_expenses_import_job_id ON expenses (import_job_id);


/* ----------------------------------------------------------------------------
 * 4. import_job_id on income_transactions (provenance)
 * --------------------------------------------------------------------------- */

ALTER TABLE income_transactions
    ADD COLUMN IF NOT EXISTS import_job_id uuid REFERENCES import_jobs(id);

CREATE INDEX IF NOT EXISTS idx_income_transactions_import_job_id ON income_transactions (import_job_id);


/* ----------------------------------------------------------------------------
 * 5. approve_expenses_by_import_job
 *    Batch-approves all pending expenses linked to an import job.
 *    Creates a ledger debit entry per expense via the existing insert_ledger().
 *    Returns the count of approved expenses.
 * --------------------------------------------------------------------------- */

CREATE OR REPLACE FUNCTION approve_expenses_by_import_job(
    p_job_id  uuid,
    p_user_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expense record;
    v_count   integer := 0;
BEGIN
    FOR v_expense IN
        SELECT * FROM expenses
        WHERE  import_job_id = p_job_id
          AND  status        = 'pending'
        FOR UPDATE
    LOOP
        UPDATE expenses
        SET    status      = 'approved',
               approved_by = p_user_id,
               approved_at = now()
        WHERE  id = v_expense.id;

        PERFORM insert_ledger(
            v_expense.rt_id,
            'pengeluaran',
            'pengeluaran',
            v_expense.id,
            now(),
            COALESCE(v_expense.description, 'Pengeluaran RT'),
            v_expense.amount::bigint,
            p_user_id
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

REVOKE ALL     ON FUNCTION approve_expenses_by_import_job(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION approve_expenses_by_import_job(uuid, uuid) TO service_role;


/* ----------------------------------------------------------------------------
 * 6. reject_expenses_by_import_job
 *    Batch-rejects all pending expenses linked to an import job (no ledger entry).
 *    Returns the count of rejected expenses.
 * --------------------------------------------------------------------------- */

CREATE OR REPLACE FUNCTION reject_expenses_by_import_job(
    p_job_id  uuid,
    p_user_id uuid,
    p_reason  text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count integer;
BEGIN
    UPDATE expenses
    SET    status         = 'rejected',
           approved_by    = p_user_id,
           rejection_note = p_reason
    WHERE  import_job_id = p_job_id
      AND  status        = 'pending';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

REVOKE ALL     ON FUNCTION reject_expenses_by_import_job(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION reject_expenses_by_import_job(uuid, uuid, text) TO service_role;
