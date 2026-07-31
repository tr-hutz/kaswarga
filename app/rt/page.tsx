import { Suspense }          from 'react'
import { getRequestContext } from '@/lib/auth/server'
import { PERMISSION }        from '@/lib/auth/types'
import { UnauthorizedError } from '@/lib/auth/errors'
import ForbiddenState        from '@/components/ui/ForbiddenState'
import RtContainer           from '../../features/rt/RtContainer'

export default async function Page() {
    try {
        const ctx  = await getRequestContext()
        const auth = ctx.authorization

        if (!auth.hasPermission(PERMISSION.USER_VIEW)) {
            return <ForbiddenState />
        }

        return (
            <Suspense>
                <RtContainer />
            </Suspense>
        )
    } catch (err) {
        if (err instanceof UnauthorizedError) {
            return <ForbiddenState />
        }
        throw err
    }
}
