import { NextResponse }      from 'next/server'
import { getRequestContext }  from '@/lib/auth/server'
import { PERMISSION }         from '@/lib/auth/types'
import { UnauthorizedError }  from '@/lib/auth/errors'
import { supabaseAdmin }      from '@/lib/supabase-admin'

interface RoleWithCount {
    id:           string
    code:         string
    name:         string
    member_count: number
}

/*
|--------------------------------------------------------------------------
| GET /api/permissions/[permissionId]/details
|--------------------------------------------------------------------------
*/

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

        const [{ data: rolePermRows, error: rpErr }, { data: overrideRows, error: ovErr }] = await Promise.all([
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabaseAdmin as any)
                .from('role_permissions')
                .select('role_id, allow, roles(id, code, name, member_count)')
                .eq('permission_id', permissionId)
                .eq('allow', true),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabaseAdmin as any)
                .from('rt_permission_overrides')
                .select('role_id, allow, roles(id, code, name, member_count)')
                .eq('permission_id', permissionId)
                .eq('rt_id', neighborhoodId),
        ])

        if (rpErr) throw rpErr
        if (ovErr) throw ovErr

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const grantedRoles: RoleWithCount[]   = (rolePermRows ?? []).map((r: any) => r.roles).filter(Boolean)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const overrideGrants: RoleWithCount[] = (overrideRows ?? []).filter((r: any) => r.allow === true).map((r: any) => r.roles).filter(Boolean)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const overrideRevokes: RoleWithCount[] = (overrideRows ?? []).filter((r: any) => r.allow === false).map((r: any) => r.roles).filter(Boolean)

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
