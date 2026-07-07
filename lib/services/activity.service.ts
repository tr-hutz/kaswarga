'use client'

import {

    supabase

} from '../supabase'

import {

    getCurrentMembership

} from '../auth/getCurrentMembership'

import {

    transformActivity

} from '../../features/activity/services/activity-transform'

/*
 |-------------------------------------------------------------
 | GET
 |-------------------------------------------------------------
 */

export async function getActivities({ limit = 100 }: { limit?: number } = {}) {

    const membership =
        await getCurrentMembership()

    const rtId =
        membership?.rt?.id

    let query =

        supabase

            .from(
                'activity_logs'
            )

            .select('*')

            .order(
                'created_at',
                {
                    ascending: false
                }
            )

            .limit(limit)

    if (rtId) {

        query =
            query.eq(
                'rt_id',
                rtId
            )
    }

    const {

        data,
        error

    } = await query

    if (error) {
        throw error
    }

    return transformActivity(
        data || []
    )
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

    const {

        error

    } = await supabase

        .from(
            'activity_logs'
        )

        .insert({

            rt_id:
            rtId || SYSTEM_RT_ID,

            actor_id:
            actorId,

            actor_name:
            actorName,

            action,

            entity_type:
            entityType,

            entity_id:
            entityId,

            description,

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            metadata: metadata as any
        })

    if (error) {
        throw error
    }
}