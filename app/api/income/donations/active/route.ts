import { NextResponse }      from 'next/server'
import { getRequestContext } from '@/lib/auth/server'
import { UnauthorizedError } from '@/lib/auth/errors'
import { findActiveDonations, getDonationProgress } from '@/lib/repositories/incomeDonation.repository'

export async function GET() {
    try {
        const ctx  = await getRequestContext()
        const rtId = ctx.authorization.neighborhoodId

        const donations = await findActiveDonations(rtId)

        const data = await Promise.all(
            donations.map(async (c: Record<string, unknown>) => {
                const progress = await getDonationProgress(c.id as string)
                return { ...c, ...progress }
            })
        )

        return NextResponse.json(data)

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        console.error('[donations/active GET]', err)
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }
}
