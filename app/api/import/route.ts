import { after }             from 'next/server'
import { NextResponse }      from 'next/server'
import { getRequestContext } from '@/lib/auth/server'
import { requirePermission } from '@/lib/auth/helpers'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'
import { PERMISSION }            from '@/lib/auth/types'
import { IMPORT_TYPE, type ImportType, type RawRow } from '@/lib/import/types'
import { getImportDefinition }   from '@/lib/import/registry'
import { createImportJob, processImportJob } from '@/lib/import/engine'
import { findImportJobsPaginated } from '@/lib/repositories/importJob.repository'
import type { QueryOptions } from '@/lib/types/query'

/*
|--------------------------------------------------------------------------
| POST /api/import
|
| Creates an import job and schedules background processing.
| Returns the job ID immediately — the dialog can close at this point.
| Progress updates arrive via Supabase Realtime on the import_jobs table.
|
| Body:
|   type:     ImportType
|   rows:     RawRow[]
|   filename: string
|   fileSize: number | null
|   fileType: string | null
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| GET /api/import
|
| Returns a paginated list of import jobs for the current RT.
| Supports filtering by status and import_type, and filename search.
|
| Query params:
|   page, pageSize, status, type, search
|--------------------------------------------------------------------------
*/

export async function GET(req: Request) {
    try {
        const ctx    = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.IMPORT_VIEW)
        const rtId = ctx.authorization.neighborhoodId

        const url      = new URL(req.url)
        const page     = parseInt(url.searchParams.get('page')     ?? '1',  10)
        const pageSize = parseInt(url.searchParams.get('pageSize') ?? '20', 10)
        const status   = url.searchParams.get('status')  ?? undefined
        const type     = url.searchParams.get('type')    ?? undefined
        const search   = url.searchParams.get('search')  ?? undefined

        const query: QueryOptions = {
            page:     isNaN(page)     ? 1  : page,
            pageSize: isNaN(pageSize) ? 20 : pageSize,
            search,
            filters: {
                ...(status ? { status }      : {}),
                ...(type   ? { import_type: type } : {}),
            },
        }

        const result = await findImportJobsPaginated(rtId, query)
        return NextResponse.json(result)

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[import/list]', err)
        return NextResponse.json({ error: 'Failed to fetch import jobs' }, { status: 500 })
    }
}

const VALID_TYPES = new Set<string>(Object.values(IMPORT_TYPE))

export async function POST(req: Request) {
    try {
        const ctx    = await getRequestContext()
        const rtId   = ctx.authorization.neighborhoodId
        const userId = ctx.authorization.userId

        const body = await req.json() as {
            type:     string
            rows:     RawRow[]
            filename: string
            fileSize: number | null
            fileType: string | null
        }

        if (!VALID_TYPES.has(body.type)) {
            return NextResponse.json({ error: `Invalid import type: ${body.type}` }, { status: 400 })
        }

        const importType = body.type as ImportType

        if (!Array.isArray(body.rows) || body.rows.length === 0) {
            return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
        }

        const definition = getImportDefinition(importType)

        // RBAC: check import permission for this type
        requirePermission(ctx.authorization, definition.importPermission)

        const jobId = await createImportJob({
            rtId,
            userId,
            type:     importType,
            filename: body.filename ?? 'import.xlsx',
            fileSize: body.fileSize ?? null,
            fileType: body.fileType ?? null,
            rowCount: body.rows.length,
        })

        // Capture rows in closure for background processing
        const rows = body.rows

        // after() runs after the HTTP response is sent (Next.js 15+)
        // The import engine processes rows, updates progress, and finalises the job.
        after(async () => {
            await processImportJob(jobId, rows, definition, rtId, userId)
        })

        return NextResponse.json({ jobId, totalRows: rows.length })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[import]', err)
        return NextResponse.json({ error: (err as Error).message || 'Failed to create import job' }, { status: 500 })
    }
}
