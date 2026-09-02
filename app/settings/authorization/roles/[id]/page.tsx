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
    const { id } = await params

    let forbidden = false
    let canEdit   = false

    try {
        const ctx  = await getRequestContext()
        const auth = ctx.authorization

        if (!auth.hasPermission(PERMISSION.ROLE_VIEW)) {
            forbidden = true
        } else {
            canEdit = auth.hasPermission(PERMISSION.PERMISSION_OVERRIDE)
        }
    } catch (err) {
        if (err instanceof UnauthorizedError) {
            forbidden = true
        } else {
            throw err
        }
    }

    if (forbidden) return <ForbiddenState />

    const role = await findRoleById(id)
    if (!role) notFound()

    return (
        <Suspense>
            <RoleDetailContainer
                role={role}
                canEdit={canEdit}
            />
        </Suspense>
    )
}
