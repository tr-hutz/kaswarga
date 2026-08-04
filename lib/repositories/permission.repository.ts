/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin } from '@/lib/supabase-admin'

// Cast to any because the generated Database types don't include the RBAC tables
// (permissions, role_permissions) added in migrations 012–013.
const db = supabaseAdmin as any

export interface PermissionRow {
    id:          string
    code:        string
    name:        string
    description: string | null
    is_system:   boolean
}

export interface RolePermissionRow {
    permission_id: string
    allow:         boolean
}

export async function listAllPermissions(): Promise<PermissionRow[]> {
    const { data, error } = await db
        .from('permissions')
        .select('id, code, name, description, is_system')
        .order('code', { ascending: true })

    if (error) throw error
    return (data as PermissionRow[]) ?? []
}

export async function listRolePermissions(roleId: string): Promise<RolePermissionRow[]> {
    const { data, error } = await db
        .from('role_permissions')
        .select('permission_id, allow')
        .eq('role_id', roleId)

    if (error) throw error
    return (data as RolePermissionRow[]) ?? []
}

export async function replaceRolePermissions(
    roleId:        string,
    permissionIds: string[],
): Promise<void> {
    const { error: deleteError } = await db
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)

    if (deleteError) throw deleteError

    if (permissionIds.length === 0) return

    const rows = permissionIds.map((pid: string) => ({
        role_id:       roleId,
        permission_id: pid,
        allow:         true,
    }))

    const { error: insertError } = await db
        .from('role_permissions')
        .insert(rows)

    if (insertError) throw insertError
}
