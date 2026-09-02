import { logActivity } from './activity-logger'
import type { UserRole } from '@/types'
import {
    findAllUsersWithMemberships,
    findMembershipById,
    updateMembershipRoleById,
    insertMembership,
    deleteMembershipById
} from '@/lib/repositories/user.repository'

const SYSTEM_RT_ID = '00000000-0000-0000-0000-000000000001'

/*
|--------------------------------------------------------------------------
| GET ALL USERS WITH MEMBERSHIP
|--------------------------------------------------------------------------
*/

export async function getAllUsers() {
    return findAllUsersWithMemberships()
}

/*
|--------------------------------------------------------------------------
| UPDATE USER MEMBERSHIP ROLE
|--------------------------------------------------------------------------
*/

export async function updateMembershipRole(membershipId: string, newRole: UserRole, actorMembership: { user?: { id?: string; name?: string } | null } | null) {

    const before = await findMembershipById(membershipId)

    const data = await updateMembershipRoleById(membershipId, newRole)

    logActivity({
        rtId:       SYSTEM_RT_ID,
        actorId:    actorMembership?.user?.id,
        actorName:  actorMembership?.user?.name,
        action:     'UPDATE_USER_ROLE',
        entityType: 'memberships',
        entityId:   membershipId,
        description: `Change user role from ${before?.role} to ${newRole}`,
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

    const data = await insertMembership({ user_id: userId, rt_id: rtId, role })

    logActivity({
        rtId:       SYSTEM_RT_ID,
        actorId:    actorMembership?.user?.id,
        actorName:  actorMembership?.user?.name,
        action:     'ASSIGN_USER_RT',
        entityType: 'memberships',
        entityId:   data.id,
        description: `Assign user to RT with role ${role}`,
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

    const before = await findMembershipById(membershipId)

    await deleteMembershipById(membershipId)

    logActivity({
        rtId:       SYSTEM_RT_ID,
        actorId:    actorMembership?.user?.id,
        actorName:  actorMembership?.user?.name,
        action:     'REMOVE_USER_RT',
        entityType: 'memberships',
        entityId:   membershipId,
        description: `Remove user membership from RT`,
        metadata:   { user_id: before?.user_id, rt_id: before?.rt_id, role: before?.role }
    })

    return true
}
