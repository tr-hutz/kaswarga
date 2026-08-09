import { after }             from 'next/server'
import { NextResponse }      from 'next/server'
import { getRequestContext } from '@/lib/auth/server'
import { requirePermission } from '@/lib/auth/helpers'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'
import { IMPORT_TYPE, type ImportType, type RawRow } from '@/lib/import/types'
import { getImportDefinition }  from '@/lib/import/registry'
import { createImportJob, processImportJob } from '@/lib/import/engine'

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
