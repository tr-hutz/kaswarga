import { NextResponse }       from 'next/server'
import { getRequestContext }  from '@/lib/auth/server'
import { requirePermission }  from '@/lib/auth/helpers'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'
import { supabaseAdmin }      from '@/lib/supabase-admin'
import { getImportDefinition }   from '@/lib/import/registry'
import { approveImportJobWithRows } from '@/lib/import/engine'
import { IMPORT_STATUS, IMPORT_ROW_STATUS, type ImportJob, type ImportJobRow, type RawRow } from '@/lib/import/types'

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
        const rtId       = ctx.authorization.neighborhoodId
        const approverId = ctx.authorization.userId
        const { id }     = await params

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: job, error: jobError } = await (supabaseAdmin as any)
            .from('import_jobs')
            .select('*')
            .eq('id', id)
            .eq('rt_id', rtId)
            .single()

        if (jobError || !job) {
            return NextResponse.json({ error: 'Import job not found' }, { status: 404 })
        }

        const typedJob = job as ImportJob

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

        // Fetch valid rows — explicit limit bypasses Supabase's default 1000-row cap
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: validRowRecords, error: rowsError } = await (supabaseAdmin as any)
            .from('import_job_rows')
            .select('*')
            .eq('import_job_id', id)
            .eq('status', IMPORT_ROW_STATUS.VALID)
            .order('row_number', { ascending: true })
            .limit(10000)

        if (rowsError) {
            return NextResponse.json({ error: 'Failed to fetch import rows' }, { status: 500 })
        }

        const rawRows: RawRow[] = ((validRowRecords ?? []) as ImportJobRow[])
            .map(r => r.raw_data as RawRow)
            .filter(Boolean)

        // Re-run preload + transform to rebuild typed rows server-side
        const context     = { jobId: id, rtId, userId: approverId }
        const preloaded   = definition.preload ? await definition.preload(context) : {}
        const enrichedCtx = { ...context, ...preloaded }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const validTyped: any[] = rawRows
            .map(row => {
                const result = definition.validateRow(row, enrichedCtx)
                return result.valid ? definition.transform(row, enrichedCtx) : null
            })
            .filter(Boolean)

        await approveImportJobWithRows(id, approverId, validTyped, definition, rtId)

        return NextResponse.json({ ok: true })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[import/approve]', err)
        return NextResponse.json({ error: (err as Error).message || 'Approval failed' }, { status: 500 })
    }
}
