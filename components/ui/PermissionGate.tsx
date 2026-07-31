'use client'

import { useAuth } from '@/lib/auth/useAuth'
import ForbiddenState from './ForbiddenState'

interface Props {
    permission: string
    children: React.ReactNode
}

export default function PermissionGate({ permission, children }: Props) {
    const auth = useAuth()

    if (!auth || auth.loading) return null

    const perms: ReadonlySet<string> = auth?.permissions ?? new Set()

    if (!perms.has(permission)) {
        return <ForbiddenState />
    }

    return <>{children}</>
}
