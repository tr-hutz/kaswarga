/*
 * Shared Import Framework — ImportDefinition Contract
 *
 * Every domain that participates in the Shared Import Framework must implement
 * this interface. The framework owns the lifecycle; the definition owns the
 * domain rules.
 *
 * The shared engine MUST NOT contain domain-specific logic.
 * Domain definitions MUST NOT duplicate lifecycle management.
 */

import type { Permission }           from '@/lib/auth/types'
import type {
    ImportType,
    ApprovalPolicy,
    RawRow,
    RowValidationResult,
    PersistResult,
    ImportContext,
} from './types'

/* -------------------------------------------------------------------------- */
/* Column metadata (for UI preview + template generation)                     */
/* -------------------------------------------------------------------------- */

export interface ImportColumn {
    /** Normalized key used in RawRow (after alias mapping). */
    key:      string
    /** Human-readable column label for the preview table. */
    label:    string
    required: boolean
}

/* -------------------------------------------------------------------------- */
/* Template                                                                    */
/* -------------------------------------------------------------------------- */

export interface ImportTemplate {
    /** Alias map: raw header → normalized key. */
    columnAliases: Record<string, string>
    /** Example rows for the downloadable template file. */
    sampleRows:    RawRow[]
    sheetName:     string
    fileName:      string
}

/* -------------------------------------------------------------------------- */
/* ImportDefinition<T>                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Contract every domain adapter must satisfy.
 *
 * T is the domain-specific transformed row type (e.g. ResidentInsertPayload).
 * The engine calls validateRow + transform during the validation phase, and
 * persist during the commit phase (immediately for NONE policy, after approval
 * for BATCH policy).
 */
export interface ImportDefinition<T> {
    /** Unique identifier for this import type. */
    type: ImportType

    /**
     * RBAC permission required to initiate an import of this type.
     * Checked by the API route before creating the import job.
     */
    importPermission: Permission

    /**
     * RBAC permission required to approve a completed import batch.
     * Null when approvalPolicy = NONE.
     */
    approvePermission: Permission | null

    /**
     * Approval policy for this import type.
     * NONE:  rows are persisted immediately after validation.
     * BATCH: rows enter PENDING_APPROVAL; an approver must explicitly commit.
     */
    approvalPolicy: ApprovalPolicy

    /** Column definitions for the import preview UI. */
    columns: ImportColumn[]

    /** Template configuration for the downloadable example file. */
    template: ImportTemplate

    /**
     * Validates a single raw row.
     * Called once per row during the VALIDATING phase.
     * Must be synchronous and pure (no database access).
     *
     * Use context for RT-scoped data that was pre-loaded by the engine
     * (e.g. resident lookup map passed via extended context).
     */
    validateRow(row: RawRow, context: ImportContext): RowValidationResult

    /**
     * Transforms a validated raw row into the domain type T.
     * Called only for rows that passed validateRow.
     * Must be synchronous and pure.
     */
    transform(row: RawRow, context: ImportContext): T

    /**
     * Persists a batch of validated, transformed rows.
     * Called by the engine: immediately for NONE policy, after approval for BATCH.
     *
     * Must be idempotent when possible (use ON CONFLICT DO NOTHING).
     * Must use supabaseAdmin for all database writes.
     */
    persist(
        rows:    T[],
        context: ImportContext,
    ): Promise<PersistResult>

    /**
     * Optional: called once before validateRow loop to pre-load RT-scoped
     * lookup data (e.g. resident map for payment import). The returned object
     * is merged into ImportContext and passed to validateRow + transform.
     *
     * Default: no-op, returns empty object.
     */
    preload?(context: ImportContext): Promise<Record<string, unknown>>
}
