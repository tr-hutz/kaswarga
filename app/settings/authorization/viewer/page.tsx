import { Suspense }                  from 'react'
import { getRequestContext }         from '@/lib/auth/server'
import { PERMISSION }                from '@/lib/auth/types'
import { UnauthorizedError }         from '@/lib/auth/errors'
import ForbiddenState                from '@/components/ui/ForbiddenState'
import EffectivePermissionContainer  from '@/features/authorization/viewer/EffectivePermissionContainer'

export default async function Page() {
    let forbidden = false
    try {
        const ctx  = await getRequestContext()
        const auth = ctx.authorization

        if (!auth.hasPermission(PERMISSION.PERMISSION_VIEW)) {
            forbidden = true
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
            <EffectivePermissionContainer />
        </Suspense>
    )
}
