import { NextResponse }       from 'next/server'
import { supabaseAdmin }      from '@/lib/supabase-admin'
import { getRequestContext }  from '@/lib/auth/server'
import { requirePermission }  from '@/lib/auth/helpers'
import { PERMISSION }         from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'

/*
|--------------------------------------------------------------------------
| POST /api/residents/import
|
| Bulk-inserts resident rows for the caller's RT.
| Requires resident.create permission.
|
| Dedup strategy: fetch all existing (block, house_number) pairs for this
| RT in one query, filter in memory, then bulk-insert the remainder in one
| query. This avoids N sequential round-trips to Supabase.
|--------------------------------------------------------------------------
*/

export async function POST(req: Request) {
    try {
        const ctx  = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.RESIDENT_CREATE)

        const rtId  = ctx.authorization.neighborhoodId
        const userId = ctx.authorization.userId

        const body = await req.json()
        const { rows } = body

        if (!Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
        }

        const validRows = rows
            .filter(r => r.name?.trim())
            .map(r => ({
                rt_id:        rtId,
                name:         r.name.trim(),
                block:        r.block?.trim()        || null,
                house_number: r.house_number?.trim() || null,
                phone:        r.phone?.trim()        || null,
                active:       true,
            }))

        if (validRows.length === 0) {
            return NextResponse.json({ error: 'No valid rows to insert' }, { status: 400 })
        }

        // 1. Fetch all existing residents for this RT in ONE query
        const { data: existingResidents } = await supabaseAdmin
            .from('residents')
            .select('block, house_number')
            .eq('rt_id', rtId)

        // 2. Build dedup set in memory — key: `${block.lower}:${house.lower}`
        const existingKeys = new Set(
            (existingResidents || [])
                .filter(r => r.block && r.house_number)
                .map(r =>
                    `${String(r.block).toLowerCase().trim()}:${String(r.house_number).toLowerCase().trim()}`
                )
        )

        // 3. Filter out duplicates in memory
        const toInsert = validRows.filter(r => {
            if (!r.block || !r.house_number) return true
            return !existingKeys.has(`${r.block.toLowerCase()}:${r.house_number.toLowerCase()}`)
        })

        const skipped  = validRows.length - toInsert.length
        let   inserted = 0

        // 4. Bulk-insert all new rows in ONE query
        if (toInsert.length > 0) {
            const { error: insertError } = await supabaseAdmin
                .from('residents')
                .insert(toInsert)

            if (insertError) throw insertError
            inserted = toInsert.length
        }

        const { data: actor } = await supabaseAdmin.from('users').select('name').eq('id', userId).single()

        await supabaseAdmin.from('activity_logs').insert({
            rt_id:       rtId,
            actor_id:    userId,
            actor_name:  actor?.name ?? null,
            action:      'IMPORT_RESIDENTS',
            entity_type: 'residents',
            entity_id:   rtId,
            description: `Import ${inserted} residents (${skipped} dilewati sebagai duplikat)`,
            metadata:    { inserted, skipped }
        })

        return NextResponse.json({ inserted, skipped })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[residents/import]', err)
        return NextResponse.json({ error: (err as Error).message || 'Import failed' }, { status: 500 })
    }
}
