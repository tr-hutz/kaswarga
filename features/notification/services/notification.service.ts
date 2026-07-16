'use client'

import {

    supabase

} from '../../../lib/supabase'

export async function createNotification({

    rt_id,
    type,
    title,
    message,
    entity_type = null,
    entity_id = null,
    target_role = null,
    target_user_id = null

}: {
    rt_id: string
    type: string
    title: string
    message: string
    entity_type?: string | null
    entity_id?: string | null
    target_role?: string | null
    target_user_id?: string | null
}) {

    const {

        data,
        error

    } = await supabase
        .from('notifications')
        .insert({
            rt_id,
            type,
            title,
            message,
            entity_type,
            entity_id,
            target_role,
            target_user_id
        })
        .select()
        .single()

    if (error) {

        throw error
    }

    return data
}

export async function markNotificationRead(
    notificationId: string
) {

    const { error } =
        await supabase

            .from(
                'notifications'
            )

            .update({

                is_read: true

            })

            .eq(
                'id',
                notificationId
            )

    if (error)
        throw error
}

export async function markAllNotificationsRead(
    userId: string
) {

    const { error } =
        await supabase

            .from(
                'notifications'
            )

            .update({

                is_read: true

            })

            .eq(
                'target_user_id',
                userId
            )

            .eq(
                'is_read',
                false
            )

    if (error)
        throw error
}
