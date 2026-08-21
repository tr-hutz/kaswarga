import { NextResponse }       from 'next/server'
import { getRequestContext }  from '@/lib/auth/server'
import { requirePermission }  from '@/lib/auth/helpers'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'
import { supabaseAdmin }      from '@/lib/supabase-admin'
import { getImportDefinition }   from '@/lib/import/registry'
import { confirmImportJob }      from '@/lib/import/engine'
import { IMPORT_STATUS, type ImportJob } from '@/lib/import/types'

/*
|--------------------------------------------------------------------------
| POST /api/import/[id]/confirm
|
| Treasurer confirms a STAGED import batch, triggering persist() and
| transitioning the job to PENDING_APPROVAL for PIC review.
|
| Guards:
|   - Job must be STAGED
|   - Caller must hold importPermission (same permission used to create)
|--------------------------------------------------------------------------
*/

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx        = await getRequestContext()
        const ctxRtId    = ctx.authorization.neighborhoodId
        const confirmerId = ctx.authorization.userId
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
            console.error('[import/confirm] DB error — id=%s code=%s', id, jobError.code)
            return NextResponse.json({ error: 'Failed to fetch import job' }, { status: 500 })
        }
        if (!job) {
            return NextResponse.json({ error: 'Import job not found' }, { status: 404 })
        }

        const typedJob = job as ImportJob
        const rtId     = typedJob.rt_id

        if (typedJob.status !== IMPORT_STATUS.STAGED) {
            return NextResponse.json(
                { error: `Job cannot be confirmed in status: ${typedJob.status}` },
                { status: 409 }
            )
        }

        const definition = getImportDefinition(typedJob.import_type)

        // Confirmation requires the same permission as importing
        requirePermission(ctx.authorization, definition.importPermission)

        await confirmImportJob(id, confirmerId, definition, rtId)

        return NextResponse.json({ ok: true })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' },  { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },      { status: 403 })
        console.error('[import/confirm]', err)
        return NextResponse.json({ error: (err as Error).message || 'Confirmation failed' }, { status: 500 })
    }
}
