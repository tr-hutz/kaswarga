/*
 * Shared Import Framework — ImportEngine
 *
 * The engine owns the complete import lifecycle. It is domain-agnostic:
 * all business rules are delegated to the supplied ImportDefinition<T>.
 *
 * Canonical lifecycle:
 *
 *   QUEUED → PROCESSING → VALIDATING → STAGED
 *     Treasurer Confirms → PROMOTING → PROMOTED → PENDING_APPROVAL
 *       PIC Approves  → COMPLETED
 *       PIC Rejects   → REJECTED
 *     Treasurer Cancels → CANCELLED
 *
 *   NONE policy shortcut (e.g. resident):
 *   QUEUED → PROCESSING → VALIDATING → COMPLETED
 *
 * Notification semantics:
 *   Batch action  → exactly 1 notification
 *   Row-level DB update from a batch action → 0 notifications
 */

import { supabaseAdmin } from '@/lib/supabase-admin'
import {
    IMPORT_STATUS,
    IMPORT_ROW_STATUS,
    APPROVAL_POLICY,
    IMPORT_TYPE,
    type ImportType,
    type ImportStatus,
    type RawRow,
    type ImportContext,
    type ImportJob,
    type ImportJobRow,
} from './types'
import type { ImportDefinition } from './contract'
import { ImportNotFoundError, ImportStatusError } from './errors'

/** Update the job progress every N rows to limit Realtime traffic. */
const PROGRESS_BATCH_SIZE = 250

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Creates an import job record and returns the job ID.
 */
export async function createImportJob(params: {
    rtId:     string
    userId:   string
    type:     ImportType
    filename: string
    fileSize: number | null
    fileType: string | null
    rowCount: number
}): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseAdmin as any)
        .from('import_jobs')
        .insert({
            rt_id:       params.rtId,
            created_by:  params.userId,
            import_type: params.type,
            filename:    params.filename,
            file_size:   params.fileSize,
            file_type:   params.fileType,
            total_rows:  params.rowCount,
            status:      IMPORT_STATUS.QUEUED,
        })
        .select('id')
        .single()

    if (error) throw error
    return (data as { id: string }).id
}

/**
 * Processes an import job end-to-end (validation phase only).
 *
 * For NONE policy: persist() is called immediately → COMPLETED.
 * For BATCH policy: rows are staged in import_job_rows → STAGED → notify Treasurer.
 *
 * Designed to run inside Next.js after() — after the HTTP response is sent.
 */
export async function processImportJob<T>(
    jobId:      string,
    rows:       RawRow[],
    definition: ImportDefinition<T>,
    rtId:       string,
    userId:     string,
): Promise<void> {
    const context: ImportContext = { jobId, rtId, userId }

    try {
        await updateJobStatus(jobId, IMPORT_STATUS.PROCESSING, { started_at: new Date().toISOString() })

        const preloaded = definition.preload
            ? await definition.preload(context)
            : {}
        const enrichedContext = { ...context, ...preloaded }

        await updateJobStatus(jobId, IMPORT_STATUS.VALIDATING)

        // ── Validation + transformation ──────────────────────────────────────
        const validRows:   T[]                        = []
        const rowResults:  Parameters<typeof recordRowResults>[0] = []
        let   processedCount = 0

        for (const [index, row] of rows.entries()) {
            const rowNumber  = index + 2  // 1-based; row 1 = header
            const validation = definition.validateRow(row, enrichedContext)

            if (validation.valid) {
                validRows.push(definition.transform(row, enrichedContext))
                rowResults.push({
                    import_job_id: jobId,
                    row_number:    rowNumber,
                    status:        IMPORT_ROW_STATUS.VALID,
                    raw_data:      row,
                    error_code:    null,
                    error_message: null,
                })
            } else if (validation.skipped) {
                rowResults.push({
                    import_job_id: jobId,
                    row_number:    rowNumber,
                    status:        IMPORT_ROW_STATUS.SKIPPED,
                    raw_data:      row,
                    error_code:    validation.skipReason ?? 'DUPLICATE',
                    error_message: validation.errorMessage ?? 'Row skipped (duplicate)',
                })
            } else {
                rowResults.push({
                    import_job_id: jobId,
                    row_number:    rowNumber,
                    status:        IMPORT_ROW_STATUS.INVALID,
                    raw_data:      row,
                    error_code:    validation.errorCode    ?? 'VALIDATION_FAILED',
                    error_message: validation.errorMessage ?? 'Row failed validation',
                })
            }

            processedCount++

            if (processedCount % PROGRESS_BATCH_SIZE === 0 || processedCount === rows.length) {
                const percent = Math.round((processedCount / rows.length) * 100)
                void updateJobProgress(jobId, {
                    processed_rows:   processedCount,
                    success_rows:     validRows.length,
                    failed_rows:      rowResults.filter(r => r.status === IMPORT_ROW_STATUS.INVALID).length,
                    progress_percent: percent,
                })
            }
        }

        if (rowResults.length > 0) {
            await recordRowResults(rowResults)
        }

        const successRows = validRows.length
        const failedRows  = rowResults.filter(r => r.status === IMPORT_ROW_STATUS.INVALID).length
        const skippedRows = rowResults.filter(r => r.status === IMPORT_ROW_STATUS.SKIPPED).length

        if (definition.approvalPolicy === APPROVAL_POLICY.NONE) {
            // No confirmation or approval step — commit immediately.
            if (validRows.length > 0) {
                await definition.persist(validRows, enrichedContext)
            }
            await finalizeJob(jobId, IMPORT_STATUS.COMPLETED, {
                processed_rows:   processedCount,
                success_rows:     successRows,
                failed_rows:      failedRows,
                progress_percent: 100,
                completed_at:     new Date().toISOString(),
            })
            await notifyImporterComplete(jobId, rtId, userId, definition.type, {
                total: rows.length, success: successRows, failed: failedRows, skipped: skippedRows,
            })
        } else {
            // BATCH: stage rows, notify Treasurer to confirm.
            await finalizeJob(jobId, IMPORT_STATUS.STAGED, {
                processed_rows:   processedCount,
                success_rows:     successRows,
                failed_rows:      failedRows,
                progress_percent: 100,
            })
            await notifyImporterStaged(jobId, rtId, userId, definition.type, {
                total: rows.length, success: successRows, failed: failedRows, skipped: skippedRows,
            })
        }

    } catch (err) {
        console.error('[ImportEngine] processImportJob failed:', err)
        await safeMarkFailed(jobId, (err as Error).message)
    }
}

/**
 * Treasurer confirms a STAGED import job.
 *
 * Transitions: STAGED → PROMOTING → persist() → PROMOTED → PENDING_APPROVAL
 *
 * persist() is called here — not during PIC approval. This separates
 * import confirmation (Treasurer) from business approval (PIC).
 */
export async function confirmImportJob<T>(
    jobId:      string,
    confirmerId: string,
    definition: ImportDefinition<T>,
    rtId:       string,
): Promise<void> {
    const job = await getJob(jobId)
    if (job.status !== IMPORT_STATUS.STAGED) {
        throw new ImportStatusError(jobId, IMPORT_STATUS.STAGED, job.status)
    }

    // Atomic guard — prevents double-confirmation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: guardResult, error: guardError } = await (supabaseAdmin as any)
        .from('import_jobs')
        .update({
            status:       IMPORT_STATUS.PROMOTING,
            confirmed_by: confirmerId,
            confirmed_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('status', IMPORT_STATUS.STAGED)
        .select('id')

    if (guardError) throw guardError
    if (!guardResult || (guardResult as unknown[]).length === 0) {
        const current = await getJob(jobId)
        if (current.status !== IMPORT_STATUS.STAGED) return  // Already confirmed by another request
        throw new ImportStatusError(jobId, IMPORT_STATUS.STAGED, current.status)
    }

    // Fetch valid rows — stored by processImportJob
    let validRowRecords: ImportJobRow[]
    try {
        validRowRecords = await fetchAllJobRows(jobId, 'VALID')
    } catch (err) {
        await safeMarkFailed(jobId, 'Failed to fetch valid rows for confirmation')
        throw err
    }

    const rawRows: RawRow[] = validRowRecords
        .map(r => r.raw_data as RawRow)
        .filter(Boolean)

    // Re-run preload + transform with the confirmer's context.
    // The confirmer is always the original importer (or someone with import permission).
    // context.userId = confirmerId = original importer → correct created_by on domain records.
    const context: ImportContext = { jobId, rtId, userId: confirmerId }
    const preloaded = definition.preload ? await definition.preload(context) : {}
    // Override dedup sets — validation already ran; don't re-reject valid rows.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedCtx = { ...context, ...preloaded, dbSet: new Set<string>(), fileSet: new Set<string>(), existingSet: new Set<string>() }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validTyped: any[] = []
    for (const row of rawRows) {
        const result = definition.validateRow(row, enrichedCtx)
        if (result.valid) {
            validTyped.push(definition.transform(row, enrichedCtx))
        }
    }

    try {
        if (validTyped.length > 0) {
            await definition.persist(validTyped, enrichedCtx)
        }
    } catch (err) {
        // persist() failed — roll back to STAGED so Treasurer can retry.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin as any)
            .from('import_jobs')
            .update({ status: IMPORT_STATUS.STAGED, confirmed_by: null, confirmed_at: null })
            .eq('id', jobId)
            .eq('status', IMPORT_STATUS.PROMOTING)
        throw err
    }

    // Transition to PROMOTED, then immediately to PENDING_APPROVAL to notify PIC.
    await finalizeJob(jobId, IMPORT_STATUS.PROMOTED, {})

    // PENDING_APPROVAL: notify the PIC approver(s).
    await finalizeJob(jobId, IMPORT_STATUS.PENDING_APPROVAL, {})
    await notifyPicPendingApproval(jobId, rtId, definition.type, validTyped.length)
}

/**
 * Treasurer cancels a STAGED import job.
 * Transitions: STAGED → CANCELLED
 * Does NOT delete staging data — kept for auditability.
 */
export async function cancelImportJob(
    jobId:     string,
    cancellerId: string,
): Promise<void> {
    const job = await getJob(jobId)
    if (job.status !== IMPORT_STATUS.STAGED) {
        throw new ImportStatusError(jobId, IMPORT_STATUS.STAGED, job.status)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin as any)
        .from('import_jobs')
        .update({ status: IMPORT_STATUS.CANCELLED })
        .eq('id', jobId)
        .eq('status', IMPORT_STATUS.STAGED)

    if (error) throw error

    // Dismiss staged notifications so importer is not left with a stale card.
    await dismissImportNotifications(jobId)

    void cancellerId // logged via API audit
}

/**
 * PIC approves a PENDING_APPROVAL import batch.
 *
 * For expense imports: batch-approves all linked pending expenses
 * (creates ledger entries via approve_expenses_by_import_job RPC).
 *
 * For all other import types: domain records are already committed;
 * approval just marks the import job as COMPLETED.
 *
 * Idempotent — safe to call twice.
 */
export async function approveImportBatch(
    jobId:      string,
    approverId: string,
    rtId:       string,
): Promise<{ approved: number }> {
    const job = await getJob(jobId)
    if (job.status !== IMPORT_STATUS.PENDING_APPROVAL) {
        throw new ImportStatusError(jobId, IMPORT_STATUS.PENDING_APPROVAL, job.status)
    }

    // Atomic transition — prevents double-approval
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: guardResult, error: guardError } = await (supabaseAdmin as any)
        .from('import_jobs')
        .update({
            status:       IMPORT_STATUS.APPROVED,
            approved_by:  approverId,
            approved_at:  new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('status', IMPORT_STATUS.PENDING_APPROVAL)
        .select('id')

    if (guardError) throw guardError
    if (!guardResult || (guardResult as unknown[]).length === 0) {
        // Another request already approved — idempotent OK
        const current = await getJob(jobId)
        if (current.status === IMPORT_STATUS.COMPLETED || current.status === IMPORT_STATUS.APPROVED) return { approved: 0 }
        throw new ImportStatusError(jobId, IMPORT_STATUS.PENDING_APPROVAL, current.status)
    }

    let approved = 0

    // Batch-approve domain records for expense imports.
    // For income/payment, records were already committed as approved by persist().
    if (job.import_type === IMPORT_TYPE.EXPENSE) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: count } = await (supabaseAdmin as any)
                .rpc('approve_expenses_by_import_job', { p_job_id: jobId, p_user_id: approverId })
            approved = (count as number) ?? 0
        } catch (err) {
            // Roll back to PENDING_APPROVAL so PIC can retry
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabaseAdmin as any)
                .from('import_jobs')
                .update({ status: IMPORT_STATUS.PENDING_APPROVAL, approved_by: null, approved_at: null })
                .eq('id', jobId)
                .eq('status', IMPORT_STATUS.APPROVED)
            throw err
        }
    } else {
        // For income/payment the count is the number of valid rows persisted.
        approved = job.success_rows
    }

    await finalizeJob(jobId, IMPORT_STATUS.COMPLETED, { completed_at: new Date().toISOString() })

    await dismissImportNotifications(jobId)

    await notifyImporterApproved(job, approved)

    return { approved }
}

/**
 * PIC rejects a PENDING_APPROVAL import batch.
 *
 * For expense imports: batch-rejects all pending linked expenses.
 * For income/payment: records already committed — domain records are kept
 * (known limitation; PIC should coordinate manually for reversals).
 */
export async function rejectImportBatch(
    jobId:      string,
    rejecterId: string,
    reason:     string | null,
): Promise<void> {
    const job = await getJob(jobId)
    if (job.status !== IMPORT_STATUS.PENDING_APPROVAL) {
        throw new ImportStatusError(jobId, IMPORT_STATUS.PENDING_APPROVAL, job.status)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin as any)
        .from('import_jobs')
        .update({
            status:           IMPORT_STATUS.REJECTED,
            rejected_by:      rejecterId,
            rejection_reason: reason,
        })
        .eq('id', jobId)
        .eq('status', IMPORT_STATUS.PENDING_APPROVAL)

    if (error) throw error

    // For expense: mark linked pending expenses as rejected.
    if (job.import_type === IMPORT_TYPE.EXPENSE) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabaseAdmin as any)
                .rpc('reject_expenses_by_import_job', {
                    p_job_id:  jobId,
                    p_user_id: rejecterId,
                    p_reason:  reason ?? null,
                })
        } catch {
            // Non-critical — the import job is already REJECTED
        }
    }

    await dismissImportNotifications(jobId)

    await notifyImporterRejected(job, reason)
}

/* -------------------------------------------------------------------------- */
/* Legacy approval path (backward compat for jobs created before migration)   */
/* -------------------------------------------------------------------------- */

/**
 * @deprecated Use approveImportBatch() for jobs created with the new flow
 * (confirmed_at is set). This path handles legacy PENDING_APPROVAL jobs where
 * persist() hasn't been called yet (confirmed_at = null).
 */
export async function approveImportJobWithRows<T>(
    jobId:      string,
    approverId: string,
    validRows:  T[],
    definition: ImportDefinition<T>,
    rtId:       string,
): Promise<{ inserted: number; details?: number }> {
    const job = await getJob(jobId)
    if (job.status !== IMPORT_STATUS.PENDING_APPROVAL) {
        throw new ImportStatusError(jobId, IMPORT_STATUS.PENDING_APPROVAL, job.status)
    }

    // Atomic transition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: guardResult, error: guardError } = await (supabaseAdmin as any)
        .from('import_jobs')
        .update({
            status:       IMPORT_STATUS.APPROVED,
            approved_by:  approverId,
            approved_at:  new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('status', IMPORT_STATUS.PENDING_APPROVAL)
        .select('id')

    if (guardError) throw guardError
    if (!guardResult || (guardResult as unknown[]).length === 0) {
        const current = await getJob(jobId)
        if (current.status === IMPORT_STATUS.COMPLETED || current.status === IMPORT_STATUS.APPROVED) return { inserted: 0 }
        throw new ImportStatusError(jobId, IMPORT_STATUS.PENDING_APPROVAL, current.status)
    }

    const context: ImportContext = { jobId, rtId, userId: job.created_by }
    const preloaded = definition.preload ? await definition.preload(context) : {}
    const enrichedContext = { ...context, ...preloaded }

    let persistResult = { inserted: 0, details: undefined as number | undefined }
    if (validRows.length > 0) {
        try {
            const result = await definition.persist(validRows, enrichedContext)
            persistResult = { inserted: result.inserted, details: result.details }
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabaseAdmin as any)
                .from('import_jobs')
                .update({ status: IMPORT_STATUS.PENDING_APPROVAL, approved_by: null, approved_at: null })
                .eq('id', jobId)
                .eq('status', IMPORT_STATUS.APPROVED)
            throw err
        }
    }

    await finalizeJob(jobId, IMPORT_STATUS.COMPLETED, { completed_at: new Date().toISOString() })
    await dismissImportNotifications(jobId)
    await notifyImporterApproved(job, persistResult.inserted)

    return persistResult
}

/**
 * @deprecated Use rejectImportBatch() for the new flow.
 * Kept for backward compat with the legacy approval path.
 */
export async function rejectImportJob(
    jobId:      string,
    rejecterId: string,
    reason:     string | null,
): Promise<void> {
    return rejectImportBatch(jobId, rejecterId, reason)
}

/* -------------------------------------------------------------------------- */
/* Row helpers                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Fetches ALL rows for a job, bypassing PostgREST's default max_rows=1000 cap.
 */
export async function fetchAllJobRows(
    jobId:  string,
    status?: string,
): Promise<ImportJobRow[]> {
    const PAGE_SIZE = 1000
    const all: ImportJobRow[] = []
    let offset = 0

    while (true) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q = (supabaseAdmin as any)
            .from('import_job_rows')
            .select('*')
            .eq('import_job_id', jobId)
            .order('row_number', { ascending: true })
            .range(offset, offset + PAGE_SIZE - 1)

        if (status) q = q.eq('status', status)

        const { data, error } = await q
        if (error) throw error

        const page = (data ?? []) as ImportJobRow[]
        all.push(...page)
        if (page.length < PAGE_SIZE) break
        offset += PAGE_SIZE
    }

    return all
}

/* -------------------------------------------------------------------------- */
/* Internal helpers                                                            */
/* -------------------------------------------------------------------------- */

async function getJob(jobId: string): Promise<ImportJob> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseAdmin as any)
        .from('import_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

    if (error) throw error
    if (!data)  throw new ImportNotFoundError(jobId)
    return data as ImportJob
}

async function updateJobStatus(
    jobId:  string,
    status: ImportStatus,
    extra?: Record<string, unknown>,
): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin as any)
        .from('import_jobs')
        .update({ status, ...extra })
        .eq('id', jobId)

    if (error) throw error
}

async function updateJobProgress(
    jobId: string,
    data: {
        processed_rows:   number
        success_rows:     number
        failed_rows:      number
        progress_percent: number
    },
): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin as any)
        .from('import_jobs')
        .update(data)
        .eq('id', jobId)
    // Best-effort — don't throw on progress update failure
}

async function finalizeJob(
    jobId:  string,
    status: ImportStatus,
    data:   Record<string, unknown> = {},
): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin as any)
        .from('import_jobs')
        .update({ status, ...data })
        .eq('id', jobId)

    if (error) throw error
}

async function safeMarkFailed(jobId: string, message: string): Promise<void> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin as any)
            .from('import_jobs')
            .update({ status: IMPORT_STATUS.FAILED, rejection_reason: message.slice(0, 500) })
            .eq('id', jobId)
    } catch {
        // Silent — already in error recovery
    }
}

type RowResultInsert = {
    import_job_id: string
    row_number:    number
    status:        string
    raw_data:      Record<string, string> | null
    error_code:    string | null
    error_message: string | null
}

const ROW_INSERT_BATCH = 500

async function recordRowResults(rows: RowResultInsert[]): Promise<void> {
    if (rows.length === 0) return
    const batches: RowResultInsert[][] = []
    for (let i = 0; i < rows.length; i += ROW_INSERT_BATCH) {
        batches.push(rows.slice(i, i + ROW_INSERT_BATCH))
    }
    await Promise.all(batches.map(async batch => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin as any).from('import_job_rows').insert(batch)
        if (error) throw error
    }))
}

async function dismissImportNotifications(jobId: string): Promise<void> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin as any)
            .from('notifications')
            .update({ is_read: true })
            .eq('entity_type', 'import_jobs')
            .eq('entity_id', jobId)
            .eq('is_read', false)
    } catch {
        // Non-critical
    }
}

/** Builds a module-specific notification type string. */
function importNotifType(
    importType: ImportType,
    event: 'staged' | 'pending_approval' | 'complete' | 'approved' | 'rejected',
): string {
    return `${importType.toLowerCase()}_import_${event}`
}

function typeName(importType: ImportType): string {
    switch (importType) {
        case 'RESIDENT': return 'warga'
        case 'PAYMENT':  return 'pembayaran'
        case 'EXPENSE':  return 'pengeluaran'
        default:         return 'pemasukan'
    }
}

/** Notifies the Treasurer (importer) that rows have been staged and await confirmation. */
async function notifyImporterStaged(
    jobId:   string,
    rtId:    string,
    userId:  string,
    type:    ImportType,
    summary: { total: number; success: number; failed: number; skipped: number },
): Promise<void> {
    try {
        const notifType = importNotifType(type, 'staged')

        // Idempotency — skip if notification already exists
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (supabaseAdmin as any)
            .from('notifications')
            .select('id')
            .eq('entity_type', 'import_jobs')
            .eq('entity_id', jobId)
            .eq('type', notifType)
            .limit(1)
            .maybeSingle()

        if (existing) return

        const name = typeName(type)
        const detail = summary.failed > 0
            ? `${summary.success} valid, ${summary.failed} tidak valid${summary.skipped > 0 ? `, ${summary.skipped} dilewati` : ''}.`
            : `${summary.success} baris valid${summary.skipped > 0 ? `, ${summary.skipped} dilewati` : ''}.`

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin as any)
            .from('notifications')
            .insert({
                rt_id:          rtId,
                type:           notifType,
                title:          `Validasi import ${name} selesai`,
                message:        `${detail} Data siap dikonfirmasi untuk disimpan.`,
                entity_type:    'import_jobs',
                entity_id:      jobId,
                target_user_id: userId,
            })
    } catch {
        // Non-critical
    }
}

/** Notifies PIC (RT Chairs) that an import batch is awaiting approval. */
async function notifyPicPendingApproval(
    jobId:    string,
    rtId:     string,
    type:     ImportType,
    rowCount: number,
): Promise<void> {
    try {
        const notifType = importNotifType(type, 'pending_approval')

        // Idempotency guard
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (supabaseAdmin as any)
            .from('notifications')
            .select('id')
            .eq('entity_type', 'import_jobs')
            .eq('entity_id', jobId)
            .eq('type', notifType)
            .limit(1)
            .maybeSingle()

        if (existing) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: chairs } = await (supabaseAdmin as any)
            .from('memberships')
            .select('user_id')
            .eq('rt_id', rtId)
            .eq('role', 'CHAIR')
            .eq('status', 'active')

        const name = typeName(type)
        if (chairs?.length) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabaseAdmin as any)
                .from('notifications')
                .insert(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (chairs as any[]).map((m: { user_id: string }) => ({
                        rt_id:          rtId,
                        type:           notifType,
                        title:          `Import ${name} menunggu persetujuan`,
                        message:        `${rowCount} baris valid siap disetujui. Tinjau dan setujui import batch ini.`,
                        entity_type:    'import_jobs',
                        entity_id:      jobId,
                        target_user_id: m.user_id,
                    }))
                )
        }
    } catch {
        // Non-critical
    }
}

/** Notifies the importer (job.created_by) that a NONE-policy import completed. */
async function notifyImporterComplete(
    jobId:   string,
    rtId:    string,
    userId:  string,
    type:    ImportType,
    summary: { total: number; success: number; failed: number; skipped: number },
): Promise<void> {
    try {
        const notifType = importNotifType(type, 'complete')

        // Idempotency
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (supabaseAdmin as any)
            .from('notifications')
            .select('id')
            .eq('entity_type', 'import_jobs')
            .eq('entity_id', jobId)
            .eq('type', notifType)
            .eq('target_user_id', userId)
            .limit(1)
            .maybeSingle()

        if (existing) return

        const name = typeName(type)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin as any)
            .from('notifications')
            .insert({
                rt_id:          rtId,
                type:           notifType,
                title:          `Import ${name} selesai`,
                message:        `${summary.total} baris diproses: ${summary.success} berhasil, ${summary.failed} gagal${summary.skipped > 0 ? `, ${summary.skipped} dilewati` : ''}.`,
                entity_type:    'import_jobs',
                entity_id:      jobId,
                target_user_id: userId,
            })
    } catch {
        // Non-critical
    }
}

/** Notifies the original importer (job.created_by) that PIC approved the batch. */
async function notifyImporterApproved(job: ImportJob, approvedCount: number): Promise<void> {
    if (!job.created_by) return
    try {
        const name = typeName(job.import_type as ImportType)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin as any)
            .from('notifications')
            .insert({
                rt_id:          job.rt_id,
                type:           importNotifType(job.import_type as ImportType, 'approved'),
                title:          `Import ${name} disetujui`,
                message:        `${approvedCount} data berhasil diimpor dari import batch ${name} Anda.`,
                entity_type:    'import_jobs',
                entity_id:      job.id,
                target_user_id: job.created_by,
            })
    } catch {
        // Non-critical
    }
}

/** Notifies the original importer (job.created_by) that PIC rejected the batch. */
async function notifyImporterRejected(job: ImportJob, reason: string | null): Promise<void> {
    if (!job.created_by) return
    try {
        const name = typeName(job.import_type as ImportType)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin as any)
            .from('notifications')
            .insert({
                rt_id:          job.rt_id,
                type:           importNotifType(job.import_type as ImportType, 'rejected'),
                title:          `Import ${name} ditolak`,
                message:        reason
                    ? `Import ditolak: ${reason}`
                    : `Import batch ${name} Anda telah ditolak.`,
                entity_type:    'import_jobs',
                entity_id:      job.id,
                target_user_id: job.created_by,
            })
    } catch {
        // Non-critical
    }
}
