import { Suspense }          from 'react'
import { getRequestContext } from '@/lib/auth/server'
import { UnauthorizedError } from '@/lib/auth/errors'
import ForbiddenState        from '@/components/ui/ForbiddenState'
import ActivityContainer     from '@/features/activity/ActivityContainer'

export default async function Page() {
    let forbidden = false
    try {
        await getRequestContext()
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
            <ActivityContainer />
        </Suspense>
    )
}
