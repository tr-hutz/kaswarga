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

export async function getActivities({

                                        limit = 100

                                    } = {}) {

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

export async function createActivity({

                                         rtId,

                                         actorId,

                                         actorName,

                                         action,

                                         entityType,

                                         entityId,

                                         description,

                                         metadata = {}

                                     }) {

    const {

        error

    } = await supabase

        .from(
            'activity_logs'
        )

        .insert({

            rt_id:
            rtId,

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

            metadata
        })

    if (error) {
        throw error
    }
}