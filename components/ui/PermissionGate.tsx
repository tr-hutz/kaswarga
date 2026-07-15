'use client'

import { useAuth } from '@/lib/auth/useAuth'
import { hasPermission } from '@/lib/permissions/permissions'
import ForbiddenState from './ForbiddenState'

interface Props {
    permission: string
    children: React.ReactNode
}

export default function PermissionGate({ permission, children }: Props) {
    // AuthContext is created with null default; cast to access typed fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auth = useAuth() as any

    if (!auth || auth.loading) return null

    if (!hasPermission(auth.role as string | null, permission)) {
        return <ForbiddenState />
    }

    return <>{children}</>
}
