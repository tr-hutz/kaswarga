import { NextResponse }       from 'next/server'
import { getRequestContext }  from '@/lib/auth/server'
import { requirePermission }  from '@/lib/auth/helpers'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'
import { supabaseAdmin }      from '@/lib/supabase-admin'
import { getImportDefinition }   from '@/lib/import/registry'
import { rejectImportJob }       from '@/lib/import/engine'
import { IMPORT_STATUS, type ImportJob } from '@/lib/import/types'

/*
|--------------------------------------------------------------------------
| POST /api/import/[id]/reject
|
| Rejects a PENDING_APPROVAL import batch.
| Body: { reason?: string }
|--------------------------------------------------------------------------
*/

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx        = await getRequestContext()
        const rtId       = ctx.authorization.neighborhoodId
        const rejecterId = ctx.authorization.userId
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
                { error: `Job cannot be rejected in status: ${typedJob.status}` },
                { status: 409 }
            )
        }

        const definition = getImportDefinition(typedJob.import_type)

        if (definition.approvePermission) {
            requirePermission(ctx.authorization, definition.approvePermission)
        }

        const { reason } = (await req.json()) as { reason?: string }

        await rejectImportJob(id, rejecterId, reason ?? null)

        return NextResponse.json({ ok: true })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[import/reject]', err)
        return NextResponse.json({ error: (err as Error).message || 'Rejection failed' }, { status: 500 })
    }
}
