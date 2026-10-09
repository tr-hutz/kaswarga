import { Suspense }           from 'react'
import { getRequestContext }  from '@/lib/auth/server'
import { UnauthorizedError }  from '@/lib/auth/errors'
import ForbiddenState         from '@/components/ui/ForbiddenState'
import GuideAdminView         from '@/features/guide/GuideAdminView'

export default async function Page() {
    let forbidden = false

    try {
        const ctx = await getRequestContext()
        if (ctx.authorization.roleCode !== 'SUPER_ADMIN') {
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
            <GuideAdminView />
        </Suspense>
    )
}
