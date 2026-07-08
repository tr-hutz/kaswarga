import { supabase } from '../supabase'
import type { Database } from '../../types/database'

type NotificationRow = Database['public']['Tables']['notifications']['Row']
type NotificationInsert = Database['public']['Tables']['notifications']['Insert']

export async function findNotificationsByUser(userId: string): Promise<NotificationRow[]> {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('target_user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20)

    if (error) throw error
    return data ?? []
}

export async function updateNotificationRead(id: string): Promise<void> {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

    if (error) throw error
}

export async function insertNotifications(rows: NotificationInsert[]): Promise<void> {
    const { error } = await supabase
        .from('notifications')
        .insert(rows)

    if (error) throw error
}
