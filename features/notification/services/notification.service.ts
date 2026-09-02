'use client'

import {
    insertNotification,
    updateNotificationRead,
    updateAllNotificationsRead,
} from '@/lib/repositories/notification.repository'

export async function createNotification({
    rt_id,
    type,
    title,
    message,
    entity_type = null,
    entity_id = null,
    target_role = null,
    target_user_id = null,
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
    return insertNotification({ rt_id, type, title, message, entity_type, entity_id, target_role, target_user_id })
}

export async function markNotificationRead(notificationId: string): Promise<void> {
    return updateNotificationRead(notificationId)
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
    return updateAllNotificationsRead(userId)
}
