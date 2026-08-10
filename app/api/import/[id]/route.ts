import { NextResponse }       from 'next/server'
import { getRequestContext }  from '@/lib/auth/server'
import { UnauthorizedError }  from '@/lib/auth/errors'
import { supabaseAdmin }      from '@/lib/supabase-admin'
import { fetchAllJobRows }    from '@/lib/import/engine'
import type { ImportJob } from '@/lib/import/types'

/*
|--------------------------------------------------------------------------
| GET /api/import/[id]
|
| Returns the import job status and error rows.
| Used by polling and for the error report download.
|--------------------------------------------------------------------------
*/

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx    = await getRequestContext()
        const ctxRtId = ctx.authorization.neighborhoodId  // '' for SUPER_ADMIN
        const { id }  = await params

        // SUPER_ADMIN has neighborhoodId='' — skip rt_id filter so they can view any RT's job
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

        // Paginated fetch — PostgREST caps at max_rows=1000 even with .limit(); must paginate.
        const errorRows = await fetchAllJobRows(id)

        return NextResponse.json({
            job:       job as ImportJob,
            errorRows,
        })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        console.error('[import/get]', err)
        return NextResponse.json({ error: 'Failed to fetch import job' }, { status: 500 })
    }
}
