import { Suspense }              from 'react'
import { getRequestContext }     from '@/lib/auth/server'
import { PERMISSION }            from '@/lib/auth/types'
import { UnauthorizedError }     from '@/lib/auth/errors'
import ForbiddenState            from '@/components/ui/ForbiddenState'
import MemberOverridesContainer  from '@/features/authorization/overrides/MemberOverridesContainer'

type PageProps = { searchParams: Promise<{ role?: string }> }

export default async function Page({ searchParams }: PageProps) {
    const { role } = await searchParams

    let forbidden = false
    let canEdit   = false

    try {
        const ctx  = await getRequestContext()
        const auth = ctx.authorization

        if (!auth.hasPermission(PERMISSION.PERMISSION_VIEW)) {
            forbidden = true
        } else {
            canEdit = auth.hasPermission(PERMISSION.PERMISSION_OVERRIDE)
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
            <MemberOverridesContainer
                canEdit={canEdit}
                initialRole={role}
            />
        </Suspense>
    )
}
