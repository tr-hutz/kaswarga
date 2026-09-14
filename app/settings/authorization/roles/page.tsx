import { Suspense }           from 'react'
import { getRequestContext }  from '@/lib/auth/server'
import { PERMISSION }         from '@/lib/auth/types'
import { UnauthorizedError }  from '@/lib/auth/errors'
import ForbiddenState         from '@/components/ui/ForbiddenState'
import RolesContainer         from '@/features/authorization/roles/RolesContainer'

export default async function Page() {
    let forbidden        = false
    let canCreate        = false
    let canUpdate        = false
    let currentRoleCode  = ''

    try {
        const ctx  = await getRequestContext()
        const auth = ctx.authorization

        if (!auth.hasPermission(PERMISSION.ROLE_VIEW)) {
            forbidden = true
        } else {
            canCreate       = auth.hasPermission(PERMISSION.ROLE_CREATE)
            canUpdate       = auth.hasPermission(PERMISSION.ROLE_UPDATE)
            currentRoleCode = auth.roleCode
        }
    } catch (err) {
        if (err instanceof UnauthorizedError) {
            forbidden = true
        } else {
            throw err
        }
    }

    if (forbidden) return <ForbiddenState />

    return (
        <Suspense>
            <RolesContainer
                canCreate={canCreate}
                canUpdate={canUpdate}
                currentRoleCode={currentRoleCode}
            />
        </Suspense>
    )
}
