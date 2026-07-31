'use client'

import { useAuth }        from './useAuth'
import type { Permission } from './types'

/**
 * Returns true when the current user holds the given RBAC v2 permission.
 * Returns false during loading or when unauthenticated.
 * SUPER_ADMIN always returns true (full permission set is loaded into context).
 */
export function usePermission(permission: Permission): boolean {
    const auth = useAuth()
    const perms: ReadonlySet<string> = auth?.permissions ?? new Set()
    return perms.has(permission)
}
