/*
 * =============================================================================
 * 032_IMPORT_JOB_ROWS
 *
 * Per-row result tracking for the Shared Import Framework.
 *
 * One row per source Excel/CSV row. Stored only for INVALID and SKIPPED rows
 * so that users can download an error report and fix their source file.
 * VALID rows are omitted to avoid storing large amounts of data unnecessarily.
 *
 * Error codes are short machine-readable identifiers (e.g. RESIDENT_NOT_FOUND,
 * DUPLICATE_PAYMENT, INVALID_AMOUNT). Error messages are human-readable.
 *
 * Dependencies: 031_import_jobs
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * Enum
 * --------------------------------------------------------------------------- */

CREATE TYPE import_row_status AS ENUM (
    'VALID',
    'INVALID',
    'SKIPPED'
);


/* ----------------------------------------------------------------------------
 * import_job_rows
 * --------------------------------------------------------------------------- */

CREATE TABLE import_job_rows (
    id              uuid              NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    import_job_id   uuid              NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
    row_number      integer           NOT NULL,
    status          import_row_status NOT NULL,

    -- Raw input data preserved for error report download
    raw_data        jsonb,

    -- Error details (only populated when status = INVALID or SKIPPED)
    error_code      text,
    error_message   text,

    created_at      timestamptz       NOT NULL DEFAULT now()
);

COMMENT ON TABLE import_job_rows IS
    'Shared Import Framework — per-row validation results. '
    'INVALID and SKIPPED rows are persisted for error reporting. '
    'VALID rows may be omitted to reduce storage.';

COMMENT ON COLUMN import_job_rows.row_number IS
    '1-based row number in the source Excel/CSV file (header row = 1, '
    'first data row = 2). Used for "Row 17: error" reporting.';

COMMENT ON COLUMN import_job_rows.raw_data IS
    'Raw parsed key-value pairs from the source row. '
    'Preserved for error report generation. '
    'Must not contain sensitive data beyond what was already in the file.';

COMMENT ON COLUMN import_job_rows.error_code IS
    'Short machine-readable error code. '
    'Examples: RESIDENT_NOT_FOUND, DUPLICATE_PAYMENT, INVALID_AMOUNT, MISSING_FIELD.';


/* ----------------------------------------------------------------------------
 * Indexes
 * --------------------------------------------------------------------------- */

CREATE INDEX idx_import_job_rows_job_id ON import_job_rows (import_job_id);
CREATE INDEX idx_import_job_rows_status ON import_job_rows (import_job_id, status);


/* ----------------------------------------------------------------------------
 * RLS
 * --------------------------------------------------------------------------- */

ALTER TABLE import_job_rows ENABLE ROW LEVEL SECURITY;

-- Accessible to any RT member who can read the parent job.
-- is_member_of_rt is SECURITY DEFINER — no recursive RLS issue.
DROP POLICY IF EXISTS "import_job_rows: rt members can read" ON import_job_rows;
CREATE POLICY "import_job_rows: rt members can read"
    ON import_job_rows FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM import_jobs j
            WHERE j.id = import_job_id
              AND is_member_of_rt(j.rt_id)
        )
    );

-- All writes go through supabaseAdmin (service_role) — no authenticated write policies.
