import { NextResponse }        from 'next/server'
import { getRequestContext }   from '@/lib/auth/server'
import { requirePermission }   from '@/lib/auth/helpers'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'
import { supabaseAdmin }       from '@/lib/supabase-admin'
import { getImportDefinition } from '@/lib/import/registry'
import {
    approveImportBatch,
    approveImportJobWithRows,
    fetchAllJobRows,
} from '@/lib/import/engine'
import { IMPORT_STATUS, type ImportJob, type ImportJobRow, type RawRow } from '@/lib/import/types'

/*
|--------------------------------------------------------------------------
| POST /api/import/[id]/approve
|
| PIC approves a PENDING_APPROVAL import batch.
|
| New flow (job has confirmed_at set):
|   Calls approveImportBatch() — no row data needed.
|   For expense imports, batch-approves all linked pending expenses.
|
| Legacy flow (job has no confirmed_at):
|   Fetches raw rows, re-transforms, calls persist() via
|   approveImportJobWithRows() — backward compat with jobs created
|   before migration 034.
|
| Guards:
|   - Job must be PENDING_APPROVAL
|   - Caller must hold approvePermission
|   - Importer !== Approver
|--------------------------------------------------------------------------
*/

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx        = await getRequestContext()
        const ctxRtId    = ctx.authorization.neighborhoodId
        const approverId = ctx.authorization.userId
        const { id }     = await params

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let jobQuery = (supabaseAdmin as any)
            .from('import_jobs')
            .select('*')
            .eq('id', id)
        if (ctxRtId) jobQuery = jobQuery.eq('rt_id', ctxRtId)

        const { data: job, error: jobError } = await jobQuery.single()

        if (jobError) {
            if (jobError.code === 'PGRST116') {
                return NextResponse.json({ error: 'Import job not found' }, { status: 404 })
            }
            console.error('[import/approve] DB error — id=%s code=%s msg=%s', id, jobError.code, jobError.message)
            return NextResponse.json({ error: 'Failed to fetch import job' }, { status: 500 })
        }
        if (!job) {
            return NextResponse.json({ error: 'Import job not found' }, { status: 404 })
        }

        const typedJob = job as ImportJob
        const rtId     = typedJob.rt_id

        if (typedJob.status !== IMPORT_STATUS.PENDING_APPROVAL) {
            return NextResponse.json(
                { error: `Job cannot be approved in status: ${typedJob.status}` },
                { status: 409 }
            )
        }

        const definition = getImportDefinition(typedJob.import_type)

        if (definition.approvePermission) {
            requirePermission(ctx.authorization, definition.approvePermission)
        }

        if (typedJob.created_by === approverId) {
            return NextResponse.json(
                { error: 'Importer tidak dapat menyetujui import milik sendiri' },
                { status: 403 }
            )
        }

        // ── New flow (job was confirmed by Treasurer) ─────────────────────────
        // persist() was already called during confirmation.
        // Just batch-approve domain records and complete the job.
        if (typedJob.confirmed_at) {
            const result = await approveImportBatch(id, approverId, rtId)
            return NextResponse.json({ ok: true, approved: result.approved })
        }

        // ── Legacy flow (job created before migration 034) ────────────────────
        // persist() has not been called yet — use the old row-based path.
        let validRowRecords: ImportJobRow[]
        try {
            validRowRecords = await fetchAllJobRows(id, 'VALID')
        } catch {
            return NextResponse.json({ error: 'Failed to fetch import rows' }, { status: 500 })
        }

        const rawRows: RawRow[] = validRowRecords
            .map(r => r.raw_data as RawRow)
            .filter(Boolean)

        // Re-run preload + transform with importer context (fix created_by).
        const context     = { jobId: id, rtId, userId: typedJob.created_by }
        const preloaded   = definition.preload ? await definition.preload(context) : {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const enrichedCtx = { ...context, ...preloaded, dbSet: new Set<string>(), fileSet: new Set<string>(), existingSet: new Set<string>() }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const validTyped: any[] = []
        const rejectedReasons: Record<string, number> = {}
        for (const row of rawRows) {
            const result = definition.validateRow(row, enrichedCtx)
            if (result.valid) {
                validTyped.push(definition.transform(row, enrichedCtx))
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const code = (result as any).errorCode ?? (result as any).skipReason ?? 'UNKNOWN'
                rejectedReasons[code] = (rejectedReasons[code] ?? 0) + 1
            }
        }

        const persistResult = await approveImportJobWithRows(id, approverId, validTyped, definition, rtId)

        return NextResponse.json({
            ok:       true,
            persisted: persistResult.inserted,
            rejected:  Object.keys(rejectedReasons).length > 0 ? rejectedReasons : undefined,
        })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' },  { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },      { status: 403 })
        const message = err instanceof Error
            ? err.message
            : (typeof err === 'object' && err !== null && typeof (err as Record<string, unknown>).message === 'string')
                ? (err as Record<string, unknown>).message as string
                : String(err)
        console.error('[import/approve]', message, err)
        return NextResponse.json({ error: message || 'Approval failed' }, { status: 500 })
    }
}
