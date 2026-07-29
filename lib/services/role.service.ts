import { PERMISSION }     from '@/lib/auth/types'
import { ForbiddenError } from '@/lib/auth/errors'
import type { AuthorizationContext } from '@/lib/auth/authorization-context'
import {
    listRoles,
    findRoleById,
    insertRole,
    updateRoleById,
} from '@/lib/repositories/role.repository'
import type { QueryOptions } from '@/lib/types/query'

export async function getRoles(options: QueryOptions, auth: AuthorizationContext) {
    if (!auth.hasPermission(PERMISSION.ROLE_VIEW)) {
        throw new ForbiddenError(PERMISSION.ROLE_VIEW)
    }
    return listRoles(options)
}

export async function createRole(
    payload: { code: string; name: string; description: string | null },
    auth: AuthorizationContext
) {
    if (!auth.hasPermission(PERMISSION.ROLE_CREATE)) {
        throw new ForbiddenError(PERMISSION.ROLE_CREATE)
    }

    const code = payload.code.toUpperCase().replace(/[^A-Z0-9_]/g, '_')

    return insertRole({
        code,
        name:        payload.name.trim(),
        description: payload.description?.trim() || null,
        is_system:   false,
        is_active:   true,
    })
}

export async function updateRole(
    id: string,
    payload: { name?: string; description?: string | null },
    auth: AuthorizationContext
) {
    if (!auth.hasPermission(PERMISSION.ROLE_UPDATE)) {
        throw new ForbiddenError(PERMISSION.ROLE_UPDATE)
    }

    const existing = await findRoleById(id)
    if (!existing) throw new Error('Role not found')

    // System roles: name is protected
    if (existing.is_system && payload.name && payload.name !== existing.name) {
        throw new ForbiddenError('Cannot rename a system role')
    }

    return updateRoleById(id, {
        name:        payload.name?.trim(),
        description: payload.description?.trim() ?? null,
    })
}

export async function setRoleActive(
    id: string,
    isActive: boolean,
    auth: AuthorizationContext
) {
    if (!auth.hasPermission(PERMISSION.ROLE_UPDATE)) {
        throw new ForbiddenError(PERMISSION.ROLE_UPDATE)
    }

    const existing = await findRoleById(id)
    if (!existing) throw new Error('Role not found')

    return updateRoleById(id, { is_active: isActive })
}
