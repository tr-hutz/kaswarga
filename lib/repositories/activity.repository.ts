import { supabase } from '../supabase'
import type { Database } from '../../types/database'

type ActivityLogRow = Database['public']['Tables']['activity_logs']['Row']
type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert']

export async function findActivities(options: { rtId?: string | null; limit: number }): Promise<ActivityLogRow[]> {
    let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(options.limit)

    if (options.rtId) {
        query = query.eq('rt_id', options.rtId)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
}

export async function insertActivity(payload: ActivityLogInsert): Promise<void> {
    const { error } = await supabase
        .from('activity_logs')
        .insert(payload)

    if (error) throw error
}
