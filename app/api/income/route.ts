import { NextResponse }      from 'next/server'
import { getRequestContext } from '@/lib/auth/server'
import { requirePermission } from '@/lib/auth/helpers'
import { PERMISSION }        from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'
import { findIncomesPaginated } from '@/lib/repositories/income.repository'
import { createIncome }         from '@/lib/services/income.service'

export async function GET(req: Request) {
    try {
        const ctx = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.INCOME_VIEW)

        const rtId = ctx.authorization.neighborhoodId
        const url  = new URL(req.url)
        const page     = Number(url.searchParams.get('page')     ?? 1)
        const pageSize = Number(url.searchParams.get('pageSize') ?? 10)
        const search   = url.searchParams.get('search') ?? ''
        const status   = url.searchParams.get('status') ?? 'all'
        const income_category = url.searchParams.get('income_category') ?? 'all'

        const result = await findIncomesPaginated(rtId, {
            page,
            pageSize,
            search,
            filters: { status, income_category },
        })

        return NextResponse.json(result)

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[income GET]', err)
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const ctx = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.INCOME_CREATE)

        const body = await req.json()
        const row  = await createIncome(body)

        return NextResponse.json(row, { status: 201 })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[income POST]', err)
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
    }
}
