import { Suspense }                 from 'react'
import { getRequestContext }        from '@/lib/auth/server'
import { UnauthorizedError }        from '@/lib/auth/errors'
import ForbiddenState               from '@/components/ui/ForbiddenState'
import RtRegistrationContainer      from '@/features/rt-registration/RtRegistrationContainer'

export default async function Page() {
    let forbidden = false
    try {
        const ctx  = await getRequestContext()
        const auth = ctx.authorization

        if (auth.roleCode !== 'SUPER_ADMIN') {
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
            <RtRegistrationContainer />
        </Suspense>
    )
}
