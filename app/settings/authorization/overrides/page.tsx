import { Suspense }              from 'react'
import { getRequestContext }     from '@/lib/auth/server'
import { PERMISSION }            from '@/lib/auth/types'
import { UnauthorizedError }     from '@/lib/auth/errors'
import ForbiddenState            from '@/components/ui/ForbiddenState'
import MemberOverridesContainer  from '@/features/authorization/overrides/MemberOverridesContainer'

type PageProps = { searchParams: Promise<{ role?: string }> }

export default async function Page({ searchParams }: PageProps) {
    try {
        const { role } = await searchParams
        const ctx       = await getRequestContext()
        const auth      = ctx.authorization

        if (!auth.hasPermission(PERMISSION.PERMISSION_VIEW)) {
            return <ForbiddenState />
        }

        return (
            <Suspense>
                <MemberOverridesContainer
                    canEdit={auth.hasPermission(PERMISSION.PERMISSION_OVERRIDE)}
                    initialRole={role}
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
