import {

    supabase

} from '../supabase'

import {

    transformNotifications

} from '../../features/notification/services/notification-transform'

export async function getNotifications() {

    const {

        data,
        error

    } = await supabase

        .from(
            'notifications'
        )

        .select('*')

        .order(
            'created_at',
            {
                ascending: false
            }
        )

        .limit(20)

    if (error) {
        throw error
    }

    return transformNotifications(
        data || []
    )
}

export async function markNotificationRead(

    id

) {

    const {

        error

    } = await supabase

        .from(
            'notifications'
        )

        .update({

            is_read:
                true

        })

        .eq(
            'id',
            id
        )

    if (error) {
        throw error
    }

    return true
}