import { supabase } from '../supabase'
import { transformNotifications } from '../../features/notification/services/notification-transform'
import { findNotificationsByUser, updateNotificationRead } from '../repositories/notification.repository'

export async function getNotifications() {

    const {
        data: { user }
    } = await supabase.auth.getUser()

    const data = await findNotificationsByUser(user?.id ?? '')

    return transformNotifications(data)
}

export async function markNotificationRead(id: string): Promise<true> {

    await updateNotificationRead(id)

    return true
}
