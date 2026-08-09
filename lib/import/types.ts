/*
 * Shared Import Framework — Core Types
 *
 * These types mirror the import_jobs and import_job_rows database tables
 * introduced in migrations 031 and 032. They are not in the generated
 * Database type (the tables are too new) so we define them here explicitly.
 */

/* -------------------------------------------------------------------------- */
/* Enums                                                                       */
/* -------------------------------------------------------------------------- */

export const IMPORT_TYPE = {
    RESIDENT: 'RESIDENT',
    PAYMENT:  'PAYMENT',
    INCOME:   'INCOME',
} as const

export type ImportType = typeof IMPORT_TYPE[keyof typeof IMPORT_TYPE]

export const IMPORT_STATUS = {
    QUEUED:            'QUEUED',
    PROCESSING:        'PROCESSING',
    VALIDATING:        'VALIDATING',
    PENDING_APPROVAL:  'PENDING_APPROVAL',
    APPROVED:          'APPROVED',
    REJECTED:          'REJECTED',
    COMPLETED:         'COMPLETED',
    FAILED:            'FAILED',
} as const

export type ImportStatus = typeof IMPORT_STATUS[keyof typeof IMPORT_STATUS]

export const IMPORT_ROW_STATUS = {
    VALID:   'VALID',
    INVALID: 'INVALID',
    SKIPPED: 'SKIPPED',
} as const

export type ImportRowStatus = typeof IMPORT_ROW_STATUS[keyof typeof IMPORT_ROW_STATUS]

export const APPROVAL_POLICY = {
    NONE:  'NONE',
    BATCH: 'BATCH',
} as const

export type ApprovalPolicy = typeof APPROVAL_POLICY[keyof typeof APPROVAL_POLICY]

/* -------------------------------------------------------------------------- */
/* Database row shapes                                                         */
/* -------------------------------------------------------------------------- */

export interface ImportJob {
    id:               string
    rt_id:            string
    import_type:      ImportType
    status:           ImportStatus
    filename:         string
    file_size:        number | null
    file_type:        string | null
    file_path:        string | null
    total_rows:       number
    processed_rows:   number
    success_rows:     number
    failed_rows:      number
    progress_percent: number
    created_by:       string
    approved_by:      string | null
    rejected_by:      string | null
    rejection_reason: string | null
    started_at:       string | null
    completed_at:     string | null
    approved_at:      string | null
    created_at:       string
    updated_at:       string
}

export interface ImportJobRow {
    id:             string
    import_job_id:  string
    row_number:     number
    status:         ImportRowStatus
    raw_data:       Record<string, string> | null
    error_code:     string | null
    error_message:  string | null
    created_at:     string
}

/* -------------------------------------------------------------------------- */
/* Domain types                                                                */
/* -------------------------------------------------------------------------- */

/** Raw parsed row from Excel/CSV — all values are strings before transformation. */
export type RawRow = Record<string, string>

/** Row-level validation result from an ImportDefinition. */
export interface RowValidationResult {
    valid:        boolean
    errorCode?:   string
    errorMessage?: string
    /** Signals the row should be skipped (dedup) rather than reported as invalid. */
    skipped?:     boolean
    skipReason?:  string
}

/** Result returned from ImportDefinition.persist() */
export interface PersistResult {
    inserted: number
    skipped:  number
}

/** Metadata needed by the engine during processing. */
export interface ImportContext {
    jobId:  string
    rtId:   string
    userId: string
}
