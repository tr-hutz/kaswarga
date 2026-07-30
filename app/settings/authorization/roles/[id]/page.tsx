import { notFound }         from 'next/navigation'
import { Suspense }          from 'react'
import { getRequestContext } from '@/lib/auth/server'
import { PERMISSION }        from '@/lib/auth/types'
import { UnauthorizedError } from '@/lib/auth/errors'
import ForbiddenState        from '@/components/ui/ForbiddenState'
import { findRoleById }      from '@/lib/repositories/role.repository'
import RoleDetailContainer   from '@/features/authorization/roles/RoleDetailContainer'

type PageProps = { params: Promise<{ id: string }> }

export default async function RoleDetailPage({ params }: PageProps) {
    try {
        const { id } = await params
        const ctx    = await getRequestContext()
        const auth   = ctx.authorization

        if (!auth.hasPermission(PERMISSION.ROLE_VIEW)) {
            return <ForbiddenState />
        }

        const role = await findRoleById(id)
        if (!role) notFound()

        return (
            <Suspense>
                <RoleDetailContainer
                    role={role}
                    canEdit={auth.hasPermission(PERMISSION.PERMISSION_OVERRIDE)}
                />
            </Suspense>
        )
    } catch (err) {
        if (err instanceof UnauthorizedError) return <ForbiddenState />
        throw err
    }
}
