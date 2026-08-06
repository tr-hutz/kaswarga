import { NextResponse }      from 'next/server'
import { getRequestContext } from '@/lib/auth/server'
import { requirePermission } from '@/lib/auth/helpers'
import { PERMISSION }        from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'
import { findIncomeById }    from '@/lib/repositories/income.repository'
import { updateIncomeById, deleteIncomeById } from '@/lib/services/income.service'

type Params = { params: Promise<{ id: string }> }

export async function GET(
    _req: Request,
    { params }: Params,
) {
    try {
        const ctx      = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.INCOME_VIEW)

        const { id } = await params
        const row    = await findIncomeById(id)
        if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        return NextResponse.json(row)

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }
}

export async function PUT(
    req: Request,
    { params }: Params,
) {
    try {
        const ctx      = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.INCOME_UPDATE)

        const { id } = await params
        const body   = await req.json()
        const row    = await updateIncomeById(id, body)

        return NextResponse.json(row)

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[income PUT]', err)
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }
}

export async function DELETE(
    _req: Request,
    { params }: Params,
) {
    try {
        const ctx      = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.INCOME_DELETE)

        const { id } = await params
        await deleteIncomeById(id)

        return NextResponse.json({ ok: true })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[income DELETE]', err)
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
}
