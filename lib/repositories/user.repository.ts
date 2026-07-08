import { supabase } from '../supabase'
import type { Database } from '../../types/database'

type UserRole = Database['public']['Enums']['user_role']
type MembershipRow = Database['public']['Tables']['memberships']['Row']
type MembershipInsert = Database['public']['Tables']['memberships']['Insert']

export async function findAllUsersWithMemberships() {
    const { data, error } = await supabase
        .from('users')
        .select(`
            id,
            name,
            email,
            created_at,
            memberships:memberships (
                id,
                role,
                rt:rt (
                    id,
                    name,
                    code
                )
            )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
}

export async function findMembershipById(id: string) {
    const { data } = await supabase
        .from('memberships')
        .select('role, user_id, rt_id')
        .eq('id', id)
        .single()
    return data
}

export async function updateMembershipRoleById(id: string, role: UserRole): Promise<MembershipRow> {
    const { data, error } = await supabase
        .from('memberships')
        .update({ role })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function insertMembership(payload: MembershipInsert): Promise<MembershipRow> {
    const { data, error } = await supabase
        .from('memberships')
        .insert(payload)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function deleteMembershipById(id: string): Promise<void> {
    const { error } = await supabase
        .from('memberships')
        .delete()
        .eq('id', id)

    if (error) throw error
}
