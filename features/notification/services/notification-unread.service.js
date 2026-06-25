'use client'

import {

    supabase

} from '../../../lib/supabase'

/*
 |-------------------------------------------------------------
 | GET UNREAD COUNT
 |-------------------------------------------------------------
 */

export async function getUnreadNotificationsCount({

                                                      user_id

                                                  }) {

    const {

        count,
        error

    } = await supabase

        .from('notifications')

        .select(

            '*',

            {

                count:
                    'exact',

                head:
                    true
            }

        )

        .eq(
            'target_user_id',
            user_id
        )

        .eq(
            'is_read',
            false
        )

    if (error) {

        console.error(
            '[GET_UNREAD_NOTIFICATIONS]',
            error
        )

        return 0
    }

    return count || 0
}

/*
 |-------------------------------------------------------------
 | MARK AS READ
 |-------------------------------------------------------------
 */

export async function markNotificationAsRead(

    id

) {

    const {

        error

    } = await supabase

        .from('notifications')

        .update({

            is_read: true
        })

        .eq(
            'id',
            id
        )

    if (error) {

        console.error(
            '[MARK_NOTIFICATION_READ]',
            error
        )

        throw error
    }
}