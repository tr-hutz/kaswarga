'use client'

import { useAuth }        from './useAuth'
import type { Permission } from './types'

// Stable empty set — avoids creating a new object on every call when the auth
// context has not yet loaded. Shared across all usePermission callers.
const EMPTY_PERMISSIONS: ReadonlySet<string> = Object.freeze(new Set())

/**
 * Returns true when the current user holds the given RBAC v2 permission.
 * Returns false during loading or when unauthenticated.
 * SUPER_ADMIN always returns true (full permission set is loaded into context).
 */
export function usePermission(permission: Permission): boolean {
    const auth = useAuth()
    const perms: ReadonlySet<string> = auth?.permissions ?? EMPTY_PERMISSIONS
    return perms.has(permission)
}
