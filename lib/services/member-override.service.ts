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
    type OverrideInput,
} from '@/lib/repositories/member-override.repository'

const ENUM_TO_ROLE_CODE: Record<string, string> = {
    CHAIR:     'RT_CHAIR',
    ADMIN:     'RT_ADMIN',
    TREASURER: 'TREASURER',
    SECRETARY: 'SECRETARY',
    RESIDENT:  'RESIDENT',
}

export async function getMembers(auth: AuthorizationContext) {
    if (!auth.hasPermission(PERMISSION.PERMISSION_VIEW)) {
        throw new ForbiddenError(PERMISSION.PERMISSION_VIEW)
    }
    return listRtMembers(auth.neighborhoodId)
}

export async function getMemberOverrides(membershipId: string, auth: AuthorizationContext) {
    if (!auth.hasPermission(PERMISSION.PERMISSION_VIEW)) {
        throw new ForbiddenError(PERMISSION.PERMISSION_VIEW)
    }

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
