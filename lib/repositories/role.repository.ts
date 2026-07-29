import { supabaseAdmin } from '@/lib/supabase-admin'
import type { QueryOptions, PageResult } from '@/lib/types/query'

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

// Maps memberships.role enum values to roles.code values
const ROLE_ENUM_MAP: Record<string, string> = {
    CHAIR:       'RT_CHAIR',
    ADMIN:       'RT_ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN',
    TREASURER:   'TREASURER',
    SECRETARY:   'SECRETARY',
    RESIDENT:    'RESIDENT',
}

export async function listRoles(options: QueryOptions): Promise<PageResult<RoleRow>> {
    const { page, pageSize, search, sortBy = 'name', sortDirection = 'asc' } = options
    const from = (page - 1) * pageSize
    const to   = from + pageSize - 1

    let query = supabaseAdmin
        .from('roles')
        .select('id, code, name, description, is_system, is_active, created_at, updated_at', { count: 'exact' })

    if (search) {
        query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`)
    }

    const validSortColumns = ['name', 'code', 'created_at', 'is_active']
    const col = validSortColumns.includes(sortBy) ? sortBy : 'name'
    query = query.order(col, { ascending: sortDirection === 'asc' })

    const { data, error, count } = await query.range(from, to)
    if (error) throw error

    // Fetch member counts in a single query using the enum→code mapping
    const rows = data ?? []
    const roleCodes = rows.map(r => r.code)
    const memberCountMap = await fetchMemberCounts(roleCodes)

    const enriched: RoleRow[] = rows.map(r => ({
        ...r,
        is_active:    r.is_active ?? true,
        member_count: memberCountMap[r.code] ?? 0,
    }))

    const total = count ?? 0

    return {
        data:       enriched,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    }
}

async function fetchMemberCounts(roleCodes: string[]): Promise<Record<string, number>> {
    if (!roleCodes.length) return {}

    // Reverse the enum map: roles.code → memberships.role enum values
    const reverseMap: Record<string, string> = {}
    for (const [enumVal, code] of Object.entries(ROLE_ENUM_MAP)) {
        reverseMap[code] = enumVal
    }

    const enumValues = roleCodes
        .map(code => reverseMap[code] ?? code)
        .filter(Boolean)

    if (!enumValues.length) return {}

    const { data, error } = await supabaseAdmin
        .from('memberships')
        .select('role')
        .in('role', enumValues as string[])
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

export async function findRoleById(id: string): Promise<RoleRow | null> {
    const { data, error } = await supabaseAdmin
        .from('roles')
        .select('id, code, name, description, is_system, is_active, created_at, updated_at')
        .eq('id', id)
        .maybeSingle()

    if (error) throw error
    if (!data) return null

    const memberCountMap = await fetchMemberCounts([data.code])
    return {
        ...data,
        is_active:    data.is_active ?? true,
        member_count: memberCountMap[data.code] ?? 0,
    }
}

export async function insertRole(payload: RoleInsert): Promise<RoleRow> {
    const { data, error } = await supabaseAdmin
        .from('roles')
        .insert(payload)
        .select('id, code, name, description, is_system, is_active, created_at, updated_at')
        .single()

    if (error) throw error
    return { ...data, is_active: data.is_active ?? true, member_count: 0 }
}

export async function updateRoleById(id: string, payload: RoleUpdate): Promise<RoleRow> {
    const { data, error } = await supabaseAdmin
        .from('roles')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id, code, name, description, is_system, is_active, created_at, updated_at')
        .single()

    if (error) throw error
    const memberCountMap = await fetchMemberCounts([data.code])
    return {
        ...data,
        is_active:    data.is_active ?? true,
        member_count: memberCountMap[data.code] ?? 0,
    }
}
