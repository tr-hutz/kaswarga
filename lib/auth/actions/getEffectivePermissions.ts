'use server'

import { getRequestContext } from '@/lib/auth/server'
import type { Permission }   from '@/lib/auth/types'

/**
 * Returns the caller's effective permission set resolved by RBAC v2.
 * Safe to call even when unauthenticated — returns [] on any failure.
 * SUPER_ADMIN receives the full permission set (all known Permission values).
 */
export async function getEffectivePermissions(): Promise<ReadonlyArray<Permission>> {
    try {
        const ctx = await getRequestContext()
        return Array.from(ctx.authorization.getPermissions())
    } catch {
        return []
    }
}
