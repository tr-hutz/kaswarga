'use client'

import type { ReactNode } from 'react'
import { useAuth }        from '@/lib/auth/useAuth'
import type { Permission } from '@/lib/auth/types'

const EMPTY_PERMISSIONS: ReadonlySet<string> = Object.freeze(new Set())

interface CanProps {
    /** Single permission code. */
    permission?:  Permission
    /** Multiple permission codes — use with `mode`. */
    permissions?: Permission[]
    /** 'any' (default): passes when at least one matches. 'all': requires all. */
    mode?:        'any' | 'all'
    children:     ReactNode
    /** Rendered when the check fails. Defaults to null. */
    fallback?:    ReactNode
}

/**
 * Renders `children` only when the current user holds the required permission(s).
 * Uses the RBAC v2 effective permission set from AuthContext.
 * SUPER_ADMIN always passes (full permission set is loaded into context).
 */
export default function Can({ permission, permissions, mode = 'any', children, fallback = null }: CanProps) {
    const auth  = useAuth()
    const perms: ReadonlySet<string> = auth?.permissions ?? EMPTY_PERMISSIONS

    const codes = permission ? [permission] : (permissions ?? [])
    if (codes.length === 0) return <>{children}</>

    const allowed = mode === 'all'
        ? codes.every(p => perms.has(p))
        : codes.some(p => perms.has(p))

    return allowed ? <>{children}</> : <>{fallback}</>
}
