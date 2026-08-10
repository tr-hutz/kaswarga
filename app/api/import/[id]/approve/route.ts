import { NextResponse }       from 'next/server'
import { getRequestContext }  from '@/lib/auth/server'
import { requirePermission }  from '@/lib/auth/helpers'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'
import { supabaseAdmin }      from '@/lib/supabase-admin'
import { getImportDefinition }   from '@/lib/import/registry'
import { approveImportJobWithRows, fetchAllJobRows } from '@/lib/import/engine'
import { IMPORT_STATUS, type ImportJob, type ImportJobRow, type RawRow } from '@/lib/import/types'

/*
|--------------------------------------------------------------------------
| POST /api/import/[id]/approve
|
| Approves a PENDING_APPROVAL import batch.
| Valid rows are fetched from import_job_rows (status=VALID) — the client
| does NOT need to send them back.
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
        const ctxRtId    = ctx.authorization.neighborhoodId  // '' for SUPER_ADMIN
        const approverId = ctx.authorization.userId
        const { id }     = await params

        // SUPER_ADMIN has neighborhoodId='' — skip the rt_id filter so they can
        // approve any RT's import. For regular users, restrict to their own RT.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let jobQuery = (supabaseAdmin as any)
            .from('import_jobs')
            .select('*')
            .eq('id', id)
        if (ctxRtId) {
            jobQuery = jobQuery.eq('rt_id', ctxRtId)
        }
        const { data: job, error: jobError } = await jobQuery.single()

        if (jobError || !job) {
            return NextResponse.json({ error: 'Import job not found' }, { status: 404 })
        }

        const typedJob = job as ImportJob
        // Use the job's rt_id as the effective RT context (handles SUPER_ADMIN case)
        const rtId = (typedJob as unknown as { rt_id: string }).rt_id

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

        // Importer !== Approver guard
        if (typedJob.created_by === approverId) {
            return NextResponse.json(
                { error: 'Importer tidak dapat menyetujui import milik sendiri' },
                { status: 403 }
            )
        }

        // Paginated fetch — PostgREST caps at max_rows=1000 even with .limit(); must paginate.
        let validRowRecords: ImportJobRow[]
        try {
            validRowRecords = await fetchAllJobRows(id, 'VALID')
        } catch {
            return NextResponse.json({ error: 'Failed to fetch import rows' }, { status: 500 })
        }

        const rawRows: RawRow[] = validRowRecords
            .map(r => r.raw_data as RawRow)
            .filter(Boolean)

        console.log('[import/approve] rawRows fetched:', rawRows.length, '| rtId:', rtId)

        // Re-run preload + transform to rebuild typed rows server-side.
        // Override dbSet with an empty set: dedup was already enforced during
        // initial processing. Re-running it here would incorrectly reject rows
        // whenever a previous import for the same data exists in the DB.
        const context     = { jobId: id, rtId, userId: approverId }
        const preloaded   = definition.preload ? await definition.preload(context) : {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const enrichedCtx = { ...context, ...preloaded, dbSet: new Set<string>(), fileSet: new Set<string>() }

        // Log residentMap size so we can diagnose RESIDENT_NOT_FOUND failures
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const preloadedAny = preloaded as any
        console.log('[import/approve] residentMap size:', preloadedAny?.residentMap?.size ?? 'N/A')
        if (rawRows.length > 0) {
            const sampleRow = rawRows[0]
            console.log('[import/approve] sample raw row keys:', Object.keys(sampleRow))
            console.log('[import/approve] sample raw row:', JSON.stringify(sampleRow))
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const validTyped: any[] = []
        const rejectedReasons: Record<string, number> = {}
        for (const row of rawRows) {
            const result = definition.validateRow(row, enrichedCtx)
            if (result.valid) {
                validTyped.push(definition.transform(row, enrichedCtx))
            } else {
                const code = (result as any).errorCode ?? (result as any).skipReason ?? 'UNKNOWN'
                rejectedReasons[code] = (rejectedReasons[code] ?? 0) + 1
            }
        }

        console.log('[import/approve] validTyped:', validTyped.length, '| rejected:', JSON.stringify(rejectedReasons))

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
