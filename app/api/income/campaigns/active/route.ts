import { NextResponse }      from 'next/server'
import { getRequestContext } from '@/lib/auth/server'
import { UnauthorizedError } from '@/lib/auth/errors'
import { findActiveCampaigns, getCampaignProgress } from '@/lib/repositories/incomeCampaign.repository'

export async function GET() {
    try {
        const ctx  = await getRequestContext()
        const rtId = ctx.authorization.neighborhoodId

        const campaigns = await findActiveCampaigns(rtId)

        const data = await Promise.all(
            campaigns.map(async (c: Record<string, unknown>) => {
                const progress = await getCampaignProgress(c.id as string)
                return { ...c, ...progress }
            })
        )

        return NextResponse.json(data)

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        console.error('[campaigns/active GET]', err)
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }
}
