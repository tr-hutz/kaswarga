import { Suspense }          from 'react'
import { getRequestContext } from '@/lib/auth/server'
import { PERMISSION }        from '@/lib/auth/types'
import { UnauthorizedError } from '@/lib/auth/errors'
import ForbiddenState        from '@/components/ui/ForbiddenState'
import LedgerContainer       from '../../features/ledger/LedgerContainer'

export default async function LedgerPage() {
    try {
        const ctx  = await getRequestContext()
        const auth = ctx.authorization

        if (!auth.hasPermission(PERMISSION.LEDGER_VIEW)) {
            return <ForbiddenState />
        }

        return (
            <Suspense>
                <LedgerContainer />
            </Suspense>
        )
    } catch (err) {
        if (err instanceof UnauthorizedError) {
            return <ForbiddenState />
        }
        throw err
    }
}
