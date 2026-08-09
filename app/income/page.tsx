import { Suspense }          from 'react'
import { getRequestContext } from '@/lib/auth/server'
import { PERMISSION }        from '@/lib/auth/types'
import { UnauthorizedError } from '@/lib/auth/errors'
import ForbiddenState        from '@/components/ui/ForbiddenState'
import IncomeContainer       from '../../features/income'

export default async function Page() {
    try {
        const ctx  = await getRequestContext()
        const auth = ctx.authorization

        if (!auth.hasPermission(PERMISSION.INCOME_VIEW)) {
            return <ForbiddenState />
        }

        return (
            <Suspense>
                <IncomeContainer />
            </Suspense>
        )
    } catch (err) {
        if (err instanceof UnauthorizedError) {
            return <ForbiddenState />
        }
        throw err
    }
}
