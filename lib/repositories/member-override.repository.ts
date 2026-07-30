/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin } from '@/lib/supabase-admin'

const db = supabaseAdmin as any

export interface MemberRow {
    membershipId: string
    userId:       string
    name:         string | null
    email:        string | null
    roleEnum:     string
    status:       string
}

export interface OverrideInput {
    permissionId: string
    allow:        boolean
}

export async function listRtMembers(rtId: string): Promise<MemberRow[]> {
    const { data, error } = await db
        .from('memberships')
        .select('id, user_id, role, status, users(name, email)')
        .eq('rt_id', rtId)
        .eq('status', 'active')
        .neq('role', 'SUPER_ADMIN')

    if (error) throw error

    return ((data ?? []) as any[]).map((m: any) => ({
        membershipId: m.id       as string,
        userId:       m.user_id  as string,
        name:         (m.users as any)?.name  ?? null,
        email:        (m.users as any)?.email ?? null,
        roleEnum:     m.role     as string,
        status:       m.status   as string,
    }))
}

export async function findMembershipById(membershipId: string): Promise<MemberRow | null> {
    const { data, error } = await db
        .from('memberships')
        .select('id, user_id, role, status, users(name, email)')
        .eq('id', membershipId)
        .maybeSingle()

    if (error) throw error
    if (!data) return null

    return {
        membershipId: (data as any).id,
        userId:       (data as any).user_id,
        name:         ((data as any).users as any)?.name  ?? null,
        email:        ((data as any).users as any)?.email ?? null,
        roleEnum:     (data as any).role,
        status:       (data as any).status,
    }
}

export async function getRoleIdByCode(roleCode: string): Promise<string | null> {
    const { data, error } = await db
        .from('roles')
        .select('id')
        .eq('code', roleCode)
        .maybeSingle()

    if (error) throw error
    return (data as any)?.id ?? null
}

export async function getRoleById(roleId: string): Promise<{ id: string; code: string; name: string } | null> {
    const { data, error } = await db
        .from('roles')
        .select('id, code, name')
        .eq('id', roleId)
        .maybeSingle()

    if (error) throw error
    return (data as any) ?? null
}

export async function getRolePermissionMap(roleId: string): Promise<Map<string, boolean>> {
    const { data, error } = await db
        .from('role_permissions')
        .select('permission_id, allow')
        .eq('role_id', roleId)

    if (error) throw error
    const map = new Map<string, boolean>()
    for (const row of (data ?? []) as any[]) {
        map.set(row.permission_id as string, row.allow as boolean)
    }
    return map
}

export async function getRtOverrideMap(rtId: string, roleId: string): Promise<Map<string, boolean>> {
    const { data, error } = await db
        .from('rt_permission_overrides')
        .select('permission_id, allow')
        .eq('rt_id', rtId)
        .eq('role_id', roleId)

    if (error) throw error
    const map = new Map<string, boolean>()
    for (const row of (data ?? []) as any[]) {
        map.set(row.permission_id as string, row.allow as boolean)
    }
    return map
}

export async function upsertRtOverrides(
    rtId:     string,
    roleId:   string,
    toUpsert: OverrideInput[],
    toDelete: string[],
): Promise<void> {
    if (toDelete.length > 0) {
        const { error } = await db
            .from('rt_permission_overrides')
            .delete()
            .eq('rt_id', rtId)
            .eq('role_id', roleId)
            .in('permission_id', toDelete)

        if (error) throw error
    }

    if (toUpsert.length > 0) {
        const rows = toUpsert.map(o => ({
            rt_id:         rtId,
            role_id:       roleId,
            permission_id: o.permissionId,
            allow:         o.allow,
            updated_at:    new Date().toISOString(),
        }))

        const { error } = await db
            .from('rt_permission_overrides')
            .upsert(rows, { onConflict: 'rt_id,role_id,permission_id' })

        if (error) throw error
    }
}
