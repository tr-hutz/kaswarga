import { supabase } from '../supabase'
import { logActivity } from './activity-logger'
import type { UserRole } from '../../types'

const SYSTEM_RT_ID = '00000000-0000-0000-0000-000000000001'

/*
|--------------------------------------------------------------------------
| GET ALL USERS WITH MEMBERSHIP
|--------------------------------------------------------------------------
*/

export async function getAllUsers() {

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

    return data || []
}

/*
|--------------------------------------------------------------------------
| UPDATE USER MEMBERSHIP ROLE
|--------------------------------------------------------------------------
*/

export async function updateMembershipRole(membershipId: string, newRole: UserRole, actorMembership: { user?: { id?: string; name?: string } | null } | null) {

    const { data: before } = await supabase
        .from('memberships')
        .select('role, user_id, rt_id')
        .eq('id', membershipId)
        .single()

    const { data, error } = await supabase
        .from('memberships')
        .update({ role: newRole })
        .eq('id', membershipId)
        .select()
        .single()

    if (error) throw error

    logActivity({
        rtId:       SYSTEM_RT_ID,
        actorId:    actorMembership?.user?.id,
        actorName:  actorMembership?.user?.name,
        action:     'UPDATE_USER_ROLE',
        entityType: 'memberships',
        entityId:   membershipId,
        description: `Ubah role user dari ${before?.role} menjadi ${newRole}`,
        metadata:   { before: before?.role, after: newRole, rt_id: before?.rt_id }
    })

    return data
}

/*
|--------------------------------------------------------------------------
| ASSIGN USER TO RT (create membership)
|--------------------------------------------------------------------------
*/

export async function assignUserToRt(
    { userId, rtId, role }: { userId: string; rtId: string; role: UserRole },
    actorMembership: { user?: { id?: string; name?: string } | null } | null
) {

    const { data, error } = await supabase
        .from('memberships')
        .insert({ user_id: userId, rt_id: rtId, role })
        .select()
        .single()

    if (error) throw error

    logActivity({
        rtId:       SYSTEM_RT_ID,
        actorId:    actorMembership?.user?.id,
        actorName:  actorMembership?.user?.name,
        action:     'ASSIGN_USER_RT',
        entityType: 'memberships',
        entityId:   data.id,
        description: `Assign user ke RT dengan role ${role}`,
        metadata:   { user_id: userId, rt_id: rtId, role }
    })

    return data
}

/*
|--------------------------------------------------------------------------
| REMOVE USER FROM RT (delete membership)
|--------------------------------------------------------------------------
*/

export async function removeMembership(membershipId: string, actorMembership: { user?: { id?: string; name?: string } | null } | null): Promise<true> {

    const { data: before } = await supabase
        .from('memberships')
        .select('role, user_id, rt_id')
        .eq('id', membershipId)
        .single()

    const { error } = await supabase
        .from('memberships')
        .delete()
        .eq('id', membershipId)

    if (error) throw error

    logActivity({
        rtId:       SYSTEM_RT_ID,
        actorId:    actorMembership?.user?.id,
        actorName:  actorMembership?.user?.name,
        action:     'REMOVE_USER_RT',
        entityType: 'memberships',
        entityId:   membershipId,
        description: `Hapus membership user dari RT`,
        metadata:   { user_id: before?.user_id, rt_id: before?.rt_id, role: before?.role }
    })

    return true
}
