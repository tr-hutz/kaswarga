'use client'

import { useAuth } from '@/lib/auth/useAuth'
import { hasPermission } from '@/lib/permissions/permissions'
import ForbiddenState from './ForbiddenState'

interface Props {
    permission: string
    children: React.ReactNode
}

export default function PermissionGate({ permission, children }: Props) {
    const { role, loading } = useAuth()

    if (loading) return null

    if (!hasPermission(role, permission)) {
        return <ForbiddenState />
    }

    return <>{children}</>
}
