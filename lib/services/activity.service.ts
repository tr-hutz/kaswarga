'use client'

import { getCurrentMembership } from '../auth/getCurrentMembership'
import { transformActivity } from '../../features/activity/services/activity-transform'
import { findActivities, insertActivity } from '../repositories/activity.repository'
import type { Json } from '../../types/database'

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

/*
 |-------------------------------------------------------------
 | CREATE
 |-------------------------------------------------------------
 */

const SYSTEM_RT_ID = '00000000-0000-0000-0000-000000000001'

export interface ActivityParams {
    rtId?: string | null
    actorId?: string | null
    actorName?: string | null
    action: string
    entityType: string
    entityId?: string | null
    description: string
    metadata?: Record<string, unknown>
}

export async function createActivity({
    rtId,
    actorId,
    actorName,
    action,
    entityType,
    entityId,
    description,
    metadata = {}
}: ActivityParams): Promise<void> {

    let resolvedRtId = rtId
    if (!resolvedRtId) {
        const membership = await getCurrentMembership()
        resolvedRtId = membership?.rt?.id ?? SYSTEM_RT_ID
    }

    await insertActivity({
        rt_id:       resolvedRtId,
        actor_id:    actorId,
        actor_name:  actorName,
        action,
        entity_type: entityType,
        entity_id:   entityId,
        description,
        metadata:    metadata as Json
    })
}
