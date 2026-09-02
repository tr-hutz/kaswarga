'use client'

import {
    countUnreadNotifications,
    updateNotificationRead,
} from '@/lib/repositories/notification.repository'

export async function getUnreadNotificationsCount({ user_id }: { user_id: string }): Promise<number> {
    return countUnreadNotifications(user_id)
}

export async function markNotificationAsRead(id: string): Promise<void> {
    return updateNotificationRead(id)
}
