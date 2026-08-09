import { NextResponse }       from 'next/server'
import { getRequestContext }  from '@/lib/auth/server'
import { requirePermission }  from '@/lib/auth/helpers'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'
import { supabaseAdmin }      from '@/lib/supabase-admin'
import { getImportDefinition }   from '@/lib/import/registry'
import { approveImportJobWithRows } from '@/lib/import/engine'
import { IMPORT_STATUS, type ImportJob, type RawRow } from '@/lib/import/types'

/*
|--------------------------------------------------------------------------
| POST /api/import/[id]/approve
|
| Approves a PENDING_APPROVAL import batch.
| Atomically transitions to APPROVED, then COMPLETED.
|
| Importer !== Approver: enforced by checking approved_by != created_by.
| The approver must hold the definition's approvePermission.
|
| Body:
|   validRows: RawRow[]   (the pre-validated rows from the original upload,
|                          sent back for atomic commit)
|--------------------------------------------------------------------------
*/

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx        = await getRequestContext()
        const rtId       = ctx.authorization.neighborhoodId
        const approverId = ctx.authorization.userId
        const { id }     = await params

        // Load job — RT isolation enforced
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

        // RBAC: check approve permission
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

        // Reconstruct valid rows from request body
        // The client sends back the rows it originally submitted (minus invalid ones)
        const body = await req.json() as { validRows: RawRow[] }
        if (!Array.isArray(body.validRows)) {
            return NextResponse.json({ error: 'validRows array required' }, { status: 400 })
        }

        // Re-run preload + transform to rebuild typed rows
        const context = { jobId: id, rtId, userId: approverId }
        const preloaded = definition.preload ? await definition.preload(context) : {}
        const enrichedContext = { ...context, ...preloaded }

        const validTyped = body.validRows
            .map(row => {
                const result = definition.validateRow(row, enrichedContext)
                return result.valid ? definition.transform(row, enrichedContext) : null
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
