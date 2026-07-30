import { Suspense }           from 'react'
import { getRequestContext }  from '@/lib/auth/server'
import { PERMISSION }         from '@/lib/auth/types'
import { UnauthorizedError }  from '@/lib/auth/errors'
import ForbiddenState         from '@/components/ui/ForbiddenState'
import RolesContainer         from '@/features/authorization/roles/RolesContainer'

export default async function Page() {
    try {
        const ctx = await getRequestContext()
        const auth = ctx.authorization

        if (!auth.hasPermission(PERMISSION.ROLE_VIEW)) {
            return <ForbiddenState />
        }

        return (
            <Suspense>
                <RolesContainer
                    canCreate={auth.hasPermission(PERMISSION.ROLE_CREATE)}
                    canUpdate={auth.hasPermission(PERMISSION.ROLE_UPDATE)}
                    currentRoleCode={auth.roleCode}
                />
            </Suspense>
        )
    } catch (err) {
        if (err instanceof UnauthorizedError) {
            return <ForbiddenState />
        }
        throw err
    }
}
