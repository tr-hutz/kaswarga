/*
 * =============================================================================
 * 031_IMPORT_JOBS
 *
 * Introduces the generic Import Job model for the Shared Import Framework.
 *
 * import_jobs tracks the full lifecycle of a bulk import operation.
 * One row is created per import attempt, regardless of module.
 *
 * Status lifecycle:
 *   QUEUED → PROCESSING → VALIDATING → PENDING_APPROVAL → APPROVED / REJECTED
 *                                    ↘ COMPLETED (approvalPolicy = NONE)
 *                                    ↘ FAILED    (on unrecoverable error)
 *
 * Supported import types: RESIDENT, PAYMENT, INCOME
 *
 * Row-level results are stored in import_job_rows (032_import_job_rows.sql).
 *
 * Dependencies: 000_foundation, 007_rls, 013_rbac_functions
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * Enums
 * --------------------------------------------------------------------------- */

CREATE TYPE import_type AS ENUM (
    'RESIDENT',
    'PAYMENT',
    'INCOME',
    'EXPENSE'
);

CREATE TYPE import_status AS ENUM (
    'QUEUED',
    'PROCESSING',
    'VALIDATING',
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'COMPLETED',
    'FAILED'
);


/* ----------------------------------------------------------------------------
 * import_jobs
 * --------------------------------------------------------------------------- */

CREATE TABLE import_jobs (
    id               uuid         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rt_id            uuid         NOT NULL REFERENCES rt(id) ON DELETE CASCADE,
    import_type      import_type  NOT NULL,
    status           import_status NOT NULL DEFAULT 'QUEUED',

    -- File metadata
    filename         text         NOT NULL,
    file_size        bigint,
    file_type        text,
    file_path        text,        -- Supabase Storage path

    -- Progress counters (updated by the import engine during processing)
    total_rows       integer      NOT NULL DEFAULT 0,
    processed_rows   integer      NOT NULL DEFAULT 0,
    success_rows     integer      NOT NULL DEFAULT 0,
    failed_rows      integer      NOT NULL DEFAULT 0,
    progress_percent integer      NOT NULL DEFAULT 0
                     CHECK (progress_percent BETWEEN 0 AND 100),

    -- Actors
    created_by       uuid         NOT NULL REFERENCES users(id),
    approved_by      uuid         REFERENCES users(id),
    rejected_by      uuid         REFERENCES users(id),
    rejection_reason text,

    -- Timestamps
    started_at       timestamptz,
    completed_at     timestamptz,
    approved_at      timestamptz,
    created_at       timestamptz  NOT NULL DEFAULT now(),
    updated_at       timestamptz  NOT NULL DEFAULT now()
);

COMMENT ON TABLE import_jobs IS
    'Shared Import Framework — one row per bulk import attempt. '
    'Status transitions are enforced by the ImportEngine service. '
    'Row-level results in import_job_rows.';

COMMENT ON COLUMN import_jobs.file_path IS
    'Supabase Storage path of the uploaded source file. '
    'Null when storage upload was skipped or failed (non-blocking).';

COMMENT ON COLUMN import_jobs.progress_percent IS
    'Server-computed progress 0–100. Updated periodically during processing. '
    'Clients subscribe via Supabase Realtime for live updates.';


/* ----------------------------------------------------------------------------
 * Indexes
 * --------------------------------------------------------------------------- */

CREATE INDEX idx_import_jobs_rt_id        ON import_jobs (rt_id);
CREATE INDEX idx_import_jobs_created_by   ON import_jobs (created_by);
CREATE INDEX idx_import_jobs_status       ON import_jobs (status);
CREATE INDEX idx_import_jobs_import_type  ON import_jobs (import_type);


/* ----------------------------------------------------------------------------
 * updated_at trigger
 * --------------------------------------------------------------------------- */

CREATE OR REPLACE FUNCTION _set_import_jobs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_import_jobs_updated_at
    BEFORE UPDATE ON import_jobs
    FOR EACH ROW EXECUTE FUNCTION _set_import_jobs_updated_at();


/* ----------------------------------------------------------------------------
 * RLS
 * --------------------------------------------------------------------------- */

ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

-- Any active RT member may read import jobs for their RT.
DROP POLICY IF EXISTS "import_jobs: rt members can read" ON import_jobs;
CREATE POLICY "import_jobs: rt members can read"
    ON import_jobs FOR SELECT TO authenticated
    USING (is_member_of_rt(rt_id));

-- All writes go through supabaseAdmin (service_role) — no authenticated write policies.


/* ----------------------------------------------------------------------------
 * Realtime (progress updates delivered to subscribed clients)
 * --------------------------------------------------------------------------- */

ALTER PUBLICATION supabase_realtime ADD TABLE import_jobs;
ALTER TABLE import_jobs REPLICA IDENTITY FULL;
