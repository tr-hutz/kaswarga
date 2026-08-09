import { NextResponse }       from 'next/server'
import { getRequestContext }  from '@/lib/auth/server'
import { UnauthorizedError }  from '@/lib/auth/errors'
import { supabaseAdmin }      from '@/lib/supabase-admin'
import type { ImportJob, ImportJobRow } from '@/lib/import/types'

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
        const ctx   = await getRequestContext()
        const rtId  = ctx.authorization.neighborhoodId
        const { id } = await params

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: job, error: jobError } = await (supabaseAdmin as any)
            .from('import_jobs')
            .select('*')
            .eq('id', id)
            .eq('rt_id', rtId)  // RT isolation
            .single()

        if (jobError || !job) {
            return NextResponse.json({ error: 'Import job not found' }, { status: 404 })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: errorRows } = await (supabaseAdmin as any)
            .from('import_job_rows')
            .select('*')
            .eq('import_job_id', id)
            .order('row_number', { ascending: true })

        return NextResponse.json({
            job:       job as ImportJob,
            errorRows: (errorRows ?? []) as ImportJobRow[],
        })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        console.error('[import/get]', err)
        return NextResponse.json({ error: 'Failed to fetch import job' }, { status: 500 })
    }
}
