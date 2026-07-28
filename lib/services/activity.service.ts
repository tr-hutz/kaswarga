'use client'

import { getCurrentMembership } from '../auth/getCurrentMembership'
import { transformActivity } from '../../features/activity/services/activity-transform'
import { findActivities } from '../repositories/activity.repository'

/*
 |-------------------------------------------------------------
 | GET
 |-------------------------------------------------------------
 */

export async function getActivities({ limit = 100 }: { limit?: number } = {}) {

    const membership = await getCurrentMembership()
    const rtId = membership?.rt?.id

    const data = await findActivities({ rtId, limit })

    return transformActivity(data)
}
