import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type UserRole = Database['public']['Enums']['user_role']

export async function findMembersByRole(rtId: string, role: UserRole) {
    const { data, error } = await supabase
        .from('memberships')
        .select('user_id')
        .eq('rt_id', rtId)
        .eq('role', role)
        .eq('status', 'active')

    if (error) throw error
    return data ?? []
}
