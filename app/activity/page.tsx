import { Suspense }          from 'react'
import { getRequestContext } from '@/lib/auth/server'
import { UnauthorizedError } from '@/lib/auth/errors'
import ForbiddenState        from '@/components/ui/ForbiddenState'
import ActivityContainer     from '../../features/activity/ActivityContainer'

export default async function Page() {
    try {
        await getRequestContext()

        return (
            <Suspense>
                <ActivityContainer />
            </Suspense>
        )
    } catch (err) {
        if (err instanceof UnauthorizedError) {
            return <ForbiddenState />
        }
        throw err
    }
}
