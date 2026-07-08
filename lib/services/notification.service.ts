import {

    supabase

} from '../supabase'

import {

    transformNotifications

} from '../../features/notification/services/notification-transform'

export async function getNotifications() {

    const {
        data: { user }
    } = await supabase.auth.getUser()

    const {

        data,
        error

    } = await supabase

        .from(
            'notifications'
        )

        .select('*')

        .eq(
            'target_user_id',
            user?.id ?? ''
        )

        .is('deleted_at', null)

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

export async function markNotificationRead(id: string): Promise<true> {

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