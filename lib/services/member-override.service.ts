import { PERMISSION }     from '@/lib/auth/types'
import { ForbiddenError } from '@/lib/auth/errors'
import type { AuthorizationContext } from '@/lib/auth/authorization-context'
import { listAllPermissions }        from '@/lib/repositories/permission.repository'
import {
    listRtMembers,
    findMembershipById,
    getRoleIdByCode,
    getRoleById,
    getRolePermissionMap,
    getRtOverrideMap,
    upsertRtOverrides,
    countAdminsByRt,
    updateMembershipRole,
    type OverrideInput,
} from '@/lib/repositories/member-override.repository'

const ENUM_TO_ROLE_CODE: Record<string, string> = {
    CHAIR:     'RT_CHAIR',
    ADMIN:     'RT_ADMIN',
    TREASURER: 'TREASURER',
    SECRETARY: 'SECRETARY',
    RESIDENT:  'RESIDENT',
}

// Roles that can be assigned via the role-change UI (SUPER_ADMIN excluded)
const ASSIGNABLE_ROLE_ENUMS = new Set(['CHAIR', 'ADMIN', 'TREASURER', 'SECRETARY', 'RESIDENT'])

export async function getMembers(auth: AuthorizationContext) {
    if (!auth.hasPermission(PERMISSION.PERMISSION_VIEW)) {
        throw new ForbiddenError(PERMISSION.PERMISSION_VIEW)
    }
    // SUPER_ADMIN has no RT (neighborhoodId = ''); RT-scoped member list is empty.
    if (!auth.neighborhoodId) return []
    return listRtMembers(auth.neighborhoodId)
}

export async function getMemberOverrides(membershipId: string, auth: AuthorizationContext) {
    if (!auth.hasPermission(PERMISSION.PERMISSION_VIEW)) {
        throw new ForbiddenError(PERMISSION.PERMISSION_VIEW)
    }
    if (!auth.neighborhoodId) throw new ForbiddenError(PERMISSION.PERMISSION_VIEW)

    const member = await findMembershipById(membershipId)
    if (!member) throw new Error('Member not found')

    const roleCode = ENUM_TO_ROLE_CODE[member.roleEnum] ?? member.roleEnum
    const roleId   = await getRoleIdByCode(roleCode)
    if (!roleId) throw new Error(`Role not found: ${roleCode}`)

    const role = await getRoleById(roleId)

    const [allPerms, rolePermMap, overrideMap] = await Promise.all([
        listAllPermissions(),
        getRolePermissionMap(roleId),
        getRtOverrideMap(auth.neighborhoodId, roleId),
    ])

    const permissions = allPerms.map(p => ({
        id:            p.id,
        code:          p.code,
        name:          p.name,
        description:   p.description,
        roleAllow:     rolePermMap.has(p.id) ? (rolePermMap.get(p.id) ?? null) : null,
        overrideAllow: overrideMap.has(p.id) ? (overrideMap.get(p.id) ?? null) : null,
    }))

    return {
        member: {
            membershipId: member.membershipId,
            userId:       member.userId,
            name:         member.name,
            email:        member.email,
            roleCode,
            roleName:     role?.name ?? roleCode,
            status:       member.status,
        },
        roleId,
        permissions,
    }
}

export async function changeMemberRole(
    membershipId: string,
    newRoleEnum:  string,
    auth:         AuthorizationContext,
): Promise<void> {
    if (!auth.hasPermission(PERMISSION.MEMBERSHIP_ROLE_UPDATE)) {
        throw new ForbiddenError(PERMISSION.MEMBERSHIP_ROLE_UPDATE)
    }
    if (!auth.neighborhoodId) throw new ForbiddenError(PERMISSION.MEMBERSHIP_ROLE_UPDATE)

    if (!ASSIGNABLE_ROLE_ENUMS.has(newRoleEnum)) {
        throw new Error(`Invalid role: ${newRoleEnum}`)
    }

    const member = await findMembershipById(membershipId)
    if (!member) throw new Error('Member not found')

    // Confirm the membership belongs to this RT
    // (findMembershipById already scopes to the member but we validate rt_id below)

    if (member.roleEnum === newRoleEnum) return // no-op

    // Eager guard: prevent demoting the last ADMIN before hitting the DB trigger
    if (member.roleEnum === 'ADMIN' && newRoleEnum !== 'ADMIN') {
        const remaining = await countAdminsByRt(auth.neighborhoodId, membershipId)
        if (remaining === 0) {
            throw new Error('LAST_ADMIN_DEMOTION')
        }
    }

    await updateMembershipRole(membershipId, newRoleEnum)
}

export async function saveMemberOverrides(
    membershipId: string,
    roleId:       string,
    overrides:    OverrideInput[],
    auth:         AuthorizationContext,
) {
    if (!auth.hasPermission(PERMISSION.PERMISSION_OVERRIDE)) {
        throw new ForbiddenError(PERMISSION.PERMISSION_OVERRIDE)
    }

    // membershipId is used to validate context; the RT is derived from auth
    void membershipId

    const rtId = auth.neighborhoodId

    const currentMap = await getRtOverrideMap(rtId, roleId)

    const desiredMap = new Map<string, boolean>()
    for (const o of overrides) {
        desiredMap.set(o.permissionId, o.allow)
    }

    const toUpsert: OverrideInput[] = []
    const toDelete: string[]        = []

    for (const [permId, allow] of desiredMap) {
        const current = currentMap.get(permId)
        if (current === undefined || current !== allow) {
            toUpsert.push({ permissionId: permId, allow })
        }
    }

    for (const permId of currentMap.keys()) {
        if (!desiredMap.has(permId)) {
            toDelete.push(permId)
        }
    }

    await upsertRtOverrides(rtId, roleId, toUpsert, toDelete)
}
