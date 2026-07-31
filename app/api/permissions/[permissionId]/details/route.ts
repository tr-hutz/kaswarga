import { NextResponse }      from 'next/server'
import { getRequestContext }  from '@/lib/auth/server'
import { PERMISSION }         from '@/lib/auth/types'
import { UnauthorizedError }  from '@/lib/auth/errors'
import { supabaseAdmin }      from '@/lib/supabase-admin'

interface RoleRow {
    id:   string
    code: string
    name: string
}

interface RoleWithCount extends RoleRow {
    member_count: number
}

// memberships.role enum → roles.code
const ENUM_TO_CODE: Record<string, string> = {
    CHAIR:     'RT_CHAIR',
    ADMIN:     'RT_ADMIN',
    TREASURER: 'TREASURER',
    SECRETARY: 'SECRETARY',
    RESIDENT:  'RESIDENT',
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ permissionId: string }> }
) {
    try {
        const { permissionId } = await params
        const ctx  = await getRequestContext()
        const auth = ctx.authorization

        if (!auth.hasPermission(PERMISSION.PERMISSION_VIEW)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { neighborhoodId } = auth

        const [
            { data: rolePermRows, error: rpErr },
            { data: overrideRows, error: ovErr },
            { data: memberRows,   error: memErr },
        ] = await Promise.all([
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabaseAdmin as any)
                .from('role_permissions')
                .select('allow, roles(id, code, name)')
                .eq('permission_id', permissionId)
                .eq('allow', true),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabaseAdmin as any)
                .from('rt_permission_overrides')
                .select('allow, roles(id, code, name)')
                .eq('permission_id', permissionId)
                .eq('rt_id', neighborhoodId),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabaseAdmin as any)
                .from('memberships')
                .select('role')
                .eq('rt_id', neighborhoodId)
                .eq('status', 'active'),
        ])

        if (rpErr)  throw rpErr
        if (ovErr)  throw ovErr
        if (memErr) throw memErr

        // Build member count per role code from the memberships query
        const countByCode: Record<string, number> = {}
        for (const m of (memberRows ?? []) as Array<{ role: string }>) {
            const code = ENUM_TO_CODE[m.role] ?? m.role
            countByCode[code] = (countByCode[code] ?? 0) + 1
        }

        function withCount(role: RoleRow): RoleWithCount {
            return { ...role, member_count: countByCode[role.code] ?? 0 }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const grantedRoles:  RoleWithCount[] = (rolePermRows ?? []).map((r: any) => r.roles).filter(Boolean).map(withCount)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const overrideGrants: RoleWithCount[] = (overrideRows ?? []).filter((r: any) => r.allow === true).map((r: any) => r.roles).filter(Boolean).map(withCount)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const overrideRevokes: RoleWithCount[] = (overrideRows ?? []).filter((r: any) => r.allow === false).map((r: any) => r.roles).filter(Boolean).map(withCount)

        const grantedRoleIds = new Set(grantedRoles.map(r => r.id))
        const revokeRoleIds  = new Set(overrideRevokes.map(r => r.id))

        let effectiveMemberCount = 0
        for (const role of grantedRoles) {
            if (!revokeRoleIds.has(role.id)) effectiveMemberCount += role.member_count
        }
        for (const role of overrideGrants) {
            if (!grantedRoleIds.has(role.id)) effectiveMemberCount += role.member_count
        }

        return NextResponse.json({
            grantedRoles,
            overrideGrants,
            overrideRevokes,
            effectiveMemberCount,
            stats: {
                roleCount:       grantedRoles.length,
                totalMembers:    effectiveMemberCount,
                overrideCount:   (overrideRows ?? []).length,
                grantOverrides:  overrideGrants.length,
                revokeOverrides: overrideRevokes.length,
            },
        })
    } catch (err) {
        if (err instanceof UnauthorizedError) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('[GET /api/permissions/[permissionId]/details]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
