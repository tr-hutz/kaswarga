import { PERMISSION }     from '@/lib/auth/types'
import { ForbiddenError } from '@/lib/auth/errors'
import type { AuthorizationContext } from '@/lib/auth/authorization-context'
import {
    listAllPermissions,
    listRolePermissions,
    replaceRolePermissions,
} from '@/lib/repositories/permission.repository'

export async function getPermissions(auth: AuthorizationContext) {
    if (!auth.hasPermission(PERMISSION.PERMISSION_VIEW)) {
        throw new ForbiddenError(PERMISSION.PERMISSION_VIEW)
    }
    return listAllPermissions()
}

export async function getRolePermissions(roleId: string, auth: AuthorizationContext) {
    if (!auth.hasPermission(PERMISSION.PERMISSION_VIEW)) {
        throw new ForbiddenError(PERMISSION.PERMISSION_VIEW)
    }
    return listRolePermissions(roleId)
}

export async function saveRolePermissions(
    roleId:        string,
    permissionIds: string[],
    auth:          AuthorizationContext,
) {
    if (!auth.hasPermission(PERMISSION.PERMISSION_UPDATE)) {
        throw new ForbiddenError(PERMISSION.PERMISSION_UPDATE)
    }

    await replaceRolePermissions(roleId, permissionIds)
}
