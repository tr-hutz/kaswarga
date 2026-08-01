/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { QueryOptions, PageResult } from '@/lib/types/query'

// Cast to any because the generated Database types don't include the RBAC tables
// (roles, role_permissions) added in migrations 011–013 / 021.
const db = supabaseAdmin as any

export interface RoleRow {
    id:           string
    code:         string
    name:         string
    description:  string | null
    is_system:    boolean
    is_active:    boolean
    created_at:   string
    updated_at:   string
    member_count: number
}

export interface RoleInsert {
    code:        string
    name:        string
    description: string | null
    is_system:   boolean
    is_active:   boolean
}

export interface RoleUpdate {
    name?:        string
    description?: string | null
    is_active?:   boolean
    updated_at?:  string
}

// Maps memberships.role enum values to roles.code values.
// Only values present in the DB user_role enum are listed here.
// SECRETARY has no enum value in the DB (no memberships rows will have it).
const ROLE_ENUM_MAP: Record<string, string> = {
    CHAIR:       'RT_CHAIR',
    ADMIN:       'RT_ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN',
    TREASURER:   'TREASURER',
    RESIDENT:    'RESIDENT',
}

// Valid DB enum values — used to filter out codes that have no enum counterpart
// (e.g. SECRETARY) and would cause a Postgres enum cast error in the IN clause.
const VALID_DB_ROLE_ENUMS = new Set(Object.keys(ROLE_ENUM_MAP))

export async function listRoles(options: QueryOptions, neighborhoodId: string): Promise<PageResult<RoleRow>> {
    const { page, pageSize, search, sortBy = 'name', sortDirection = 'asc' } = options
    const from = (page - 1) * pageSize
    const to   = from + pageSize - 1

    let query = db
        .from('roles')
        .select('id, code, name, description, is_system, is_active, created_at, updated_at', { count: 'exact' })
        .neq('code', 'SUPER_ADMIN')

    if (search) {
        query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`)
    }

    const validSortColumns = ['name', 'code', 'created_at', 'is_active']
    const col = validSortColumns.includes(sortBy) ? sortBy : 'name'
    query = query.order(col, { ascending: sortDirection === 'asc' })

    const { data, error, count } = await query.range(from, to)
    if (error) throw error

    const rows = (data as RoleRow[]) ?? []
    const roleCodes = rows.map((r: RoleRow) => r.code)
    const memberCountMap = await fetchMemberCounts(roleCodes, neighborhoodId)

    const enriched: RoleRow[] = rows.map((r: RoleRow) => ({
        ...r,
        is_active:    r.is_active ?? true,
        member_count: memberCountMap[r.code] ?? 0,
    }))

    const total = (count as number) ?? 0

    return {
        data:       enriched,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    }
}

async function fetchMemberCounts(roleCodes: string[], neighborhoodId: string): Promise<Record<string, number>> {
    if (!roleCodes.length) return {}

    const reverseMap: Record<string, string> = {}
    for (const [enumVal, code] of Object.entries(ROLE_ENUM_MAP)) {
        reverseMap[code] = enumVal
    }

    const enumValues = roleCodes
        .map((code: string) => reverseMap[code] ?? code)
        .filter((e: string) => VALID_DB_ROLE_ENUMS.has(e))

    if (!enumValues.length) return {}

    const { data, error } = await (supabaseAdmin as any)
        .from('memberships')
        .select('role')
        .in('role', enumValues)
        .eq('neighborhood_id', neighborhoodId)
        .eq('status', 'active')

    if (error) {
        console.error('[role.repository] fetchMemberCounts', error)
        return {}
    }

    const counts: Record<string, number> = {}
    for (const m of data ?? []) {
        const code = ROLE_ENUM_MAP[m.role as string] ?? m.role
        counts[code] = (counts[code] ?? 0) + 1
    }
    return counts
}

export async function findRoleById(id: string, neighborhoodId?: string): Promise<RoleRow | null> {
    const { data, error } = await db
        .from('roles')
        .select('id, code, name, description, is_system, is_active, created_at, updated_at')
        .eq('id', id)
        .maybeSingle()

    if (error) throw error
    if (!data) return null

    const row = data as RoleRow
    const memberCountMap = neighborhoodId
        ? await fetchMemberCounts([row.code], neighborhoodId)
        : {}
    return {
        ...row,
        is_active:    row.is_active ?? true,
        member_count: memberCountMap[row.code] ?? 0,
    }
}

export async function insertRole(payload: RoleInsert): Promise<RoleRow> {
    const { data, error } = await db
        .from('roles')
        .insert(payload)
        .select('id, code, name, description, is_system, is_active, created_at, updated_at')
        .single()

    if (error) throw error
    const row = data as RoleRow
    return { ...row, is_active: row.is_active ?? true, member_count: 0 }
}

export async function updateRoleById(id: string, payload: RoleUpdate, neighborhoodId?: string): Promise<RoleRow> {
    const { data, error } = await db
        .from('roles')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id, code, name, description, is_system, is_active, created_at, updated_at')
        .single()

    if (error) throw error
    const row = data as RoleRow
    const memberCountMap = neighborhoodId
        ? await fetchMemberCounts([row.code], neighborhoodId)
        : {}
    return {
        ...row,
        is_active:    row.is_active ?? true,
        member_count: memberCountMap[row.code] ?? 0,
    }
}
