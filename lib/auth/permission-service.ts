/*
 * RBAC v2 — PermissionService
 *
 * The only application component permitted to resolve permissions from the
 * database. Queries role_permissions + rt_permission_overrides, merges them
 * into an effective permission set, and returns a PermissionSet for the caller.
 *
 * Design
 *   - Dependency-injected: the Supabase client is supplied via the constructor
 *   - Request-scoped cache: each instance holds a React.cache()-backed Map that
 *     is tied to the current React async context (= one HTTP request). The Map
 *     is created fresh per request and discarded automatically when the request
 *     ends — no explicit invalidation is needed.
 *   - Effective permissions are stored as ReadonlySet<Permission> so every
 *     hasPermission() call is O(1) regardless of the number of permissions.
 *
 * Resolution order (mirrors 019_update_rls_policies.sql)
 *   1. SUPER_ADMIN bypass — any SUPER_ADMIN membership grants everything
 *   2. Role permissions (role_permissions table, allow = true rows only)
 *   3. RT overrides (rt_permission_overrides) — may grant or revoke
 *   4. Effective permissions set (frozen)
 *
 * Note: roles, permissions, role_permissions, rt_permission_overrides are RBAC v2
 * tables added in Sprint 1 migrations and are not yet reflected in the generated
 * Database type. Queries on those tables use an `unknown` cast.
 *
 * Reference: docs/architecture/PERMISSION_SERVICE.md
 *            docs/architecture/AUTHORIZATION_PIPELINE.md
 */

import { cache }                        from 'react'
import type { SupabaseClient }          from '@supabase/supabase-js'

import { supabaseAdmin }                from '../supabase-admin'
import { AuthorizationContext }         from './authorization-context'
import { MembershipNotFoundError, RoleNotFoundError } from './errors'
import { PERMISSION, type Permission }  from './types'

/* -------------------------------------------------------------------------- */
/* Local row types for RBAC v2 tables (not yet in generated Database type)    */
/* -------------------------------------------------------------------------- */

type RoleRow = { id: string }

/** Supabase returns the related object (not an array) for a many-to-one FK join. */
type RolePermissionRow = {
  allow: boolean
  permissions: { code: string }
}

type OverrideRow = {
  allow: boolean
  permissions: { code: string }
}

type MembershipRoleRow = {
  id:   string
  role: string
}

/* -------------------------------------------------------------------------- */
/* Role mapping                                                                */
/*                                                                            */
/* memberships.role is the user_role enum (CHAIR, ADMIN, …) which predates   */
/* RBAC v2. roles.code uses a different naming scheme (RT_CHAIR, RT_ADMIN, …) */
/* A future migration will add role_id FK to memberships; until then this     */
/* mapping bridges the two systems — matching 018_rbac_authorization_functions */
/* -------------------------------------------------------------------------- */

const ENUM_TO_ROLE_CODE: Record<string, string> = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  CHAIR:       'RT_CHAIR',
  ADMIN:       'RT_ADMIN',
  TREASURER:   'TREASURER',
  SECRETARY:   'SECRETARY',
  RESIDENT:    'RESIDENT',
}

function toRoleCode(enumValue: string): string {
  return ENUM_TO_ROLE_CODE[enumValue] ?? enumValue
}

/* -------------------------------------------------------------------------- */
/* PermissionSet                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The result of resolving a user's effective permissions.
 * Immutable — safe to cache and pass through service layers.
 * Embedded inside AuthorizationContext to separate loading from querying.
 */
export interface PermissionSet {
  readonly userId:         string
  readonly membershipId:   string
  readonly neighborhoodId: string
  readonly roleId:         string
  readonly roleCode:       string

  /** Returns true when the user holds this permission. O(1) via Set.has(). */
  hasPermission(code: Permission): boolean

  /** Returns true when the user holds at least one of the supplied permissions. */
  hasAny(codes: Permission[]): boolean

  /** Returns true only when the user holds every one of the supplied permissions. */
  hasAll(codes: Permission[]): boolean

  /** Returns the full effective permission set for inspection (e.g. debug, UI hints). */
  getEffectivePermissions(): ReadonlySet<Permission>
}

/* Standard (role-based + overrides) implementation */
class StandardPermissionSet implements PermissionSet {
  readonly userId:         string
  readonly membershipId:   string
  readonly neighborhoodId: string
  readonly roleId:         string
  readonly roleCode:       string
  private readonly _permissions: ReadonlySet<Permission>

  constructor(
    userId:         string,
    membershipId:   string,
    neighborhoodId: string,
    roleId:         string,
    roleCode:       string,
    permissions:    ReadonlySet<Permission>
  ) {
    this.userId         = userId
    this.membershipId   = membershipId
    this.neighborhoodId = neighborhoodId
    this.roleId         = roleId
    this.roleCode       = roleCode
    this._permissions   = permissions
    Object.freeze(this)
  }

  hasPermission(code: Permission): boolean {
    return this._permissions.has(code)
  }

  hasAny(codes: Permission[]): boolean {
    return codes.some(c => this._permissions.has(c))
  }

  hasAll(codes: Permission[]): boolean {
    return codes.every(c => this._permissions.has(c))
  }

  getEffectivePermissions(): ReadonlySet<Permission> {
    return this._permissions
  }
}

/* SUPER_ADMIN override — bypasses all permission checks. roleId is empty string
 * because SUPER_ADMIN is not constrained to a specific RT role row. */
class SuperAdminPermissionSet implements PermissionSet {
  readonly userId:         string
  readonly membershipId:   string
  readonly neighborhoodId: string
  readonly roleId         = ''
  readonly roleCode       = 'SUPER_ADMIN'

  constructor(userId: string, membershipId: string, neighborhoodId: string) {
    this.userId         = userId
    this.membershipId   = membershipId
    this.neighborhoodId = neighborhoodId
    Object.freeze(this)
  }

  hasPermission(_code: Permission): boolean { return true }
  hasAny(_codes: Permission[]): boolean { return true }
  hasAll(_codes: Permission[]): boolean { return true }

  getEffectivePermissions(): ReadonlySet<Permission> {
    return new Set(Object.values(PERMISSION)) as ReadonlySet<Permission>
  }
}

/* -------------------------------------------------------------------------- */
/* PermissionService                                                           */
/* -------------------------------------------------------------------------- */

export class PermissionService {

  constructor(private readonly db: SupabaseClient) {}

  /* ------------------------------------------------------------------ */
  /* Request-scoped cache stores                                          */
  /*                                                                     */
  /* React.cache() ties the Map lifetime to the React async storage      */
  /* context, which is unique per incoming HTTP request. The Map is      */
  /* created on first access within a request and discarded when the     */
  /* request ends — no explicit invalidation is required.                */
  /*                                                                     */
  /* Each PermissionService instance gets its own cache() function       */
  /* reference so test instances never share state with each other or    */
  /* with the production singleton.                                      */
  /* ------------------------------------------------------------------ */

  private readonly _getContextStore = cache(
    (): Map<string, Promise<AuthorizationContext>> => new Map()
  )

  private readonly _getPermSetStore = cache(
    (): Map<string, Promise<PermissionSet>> => new Map()
  )

  /* ------------------------------------------------------------------ */
  /* Public API                                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Builds a fully resolved AuthorizationContext for a user.
   * Finds the user's active RT membership automatically.
   *
   * Results are cached for the lifetime of the current request.
   * Subsequent calls with the same userId return the cached context
   * without re-querying the database.
   *
   * Throws MembershipNotFoundError when the user has no active RT membership.
   *
   * Optimized to 4 DB calls on cache MISS (non-SUPER_ADMIN):
   *   1. resolveUserMembership (single memberships query)
   *   2. resolveRoleId
   *   3+4. fetchRolePermissions + fetchPermissionOverrides (parallel)
   */
  async buildContext(userId: string): Promise<AuthorizationContext> {
    const store = this._getContextStore()

    if (!store.has(userId)) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[PermissionCache] MISS  userId=%s', userId.slice(0, 8))
      }
      store.set(userId, this._buildContextCore(userId))
    } else if (process.env.NODE_ENV === 'development') {
      console.debug('[PermissionCache] HIT   userId=%s', userId.slice(0, 8))
    }

    return store.get(userId)!
  }

  /**
   * Loads the effective permissions for a user in a specific RT.
   *
   * Results are cached for the lifetime of the current request.
   * Subsequent calls with the same (userId, neighborhoodId) pair return
   * the cached PermissionSet without re-querying the database.
   *
   * Throws MembershipNotFoundError when no active membership exists.
   * Throws RoleNotFoundError when the role from memberships has no matching
   * row in the roles table (indicates a data configuration issue).
   */
  async loadPermissions(
    userId:         string,
    neighborhoodId: string
  ): Promise<PermissionSet> {
    const key   = `${userId}:${neighborhoodId}`
    const store = this._getPermSetStore()

    if (!store.has(key)) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[PermissionCache] MISS  userId=%s neighborhoodId=%s', userId.slice(0, 8), neighborhoodId.slice(0, 8))
      }
      store.set(key, this._loadPermissionsCore(userId, neighborhoodId))
    } else if (process.env.NODE_ENV === 'development') {
      console.debug('[PermissionCache] HIT   userId=%s neighborhoodId=%s', userId.slice(0, 8), neighborhoodId.slice(0, 8))
    }

    return store.get(key)!
  }

  /**
   * No-op: request-scoped cache expires automatically at request end.
   * Retained for API compatibility and future cross-request invalidation.
   */
  invalidateCache(_userId: string, _neighborhoodId: string): void {
    // Request-scoped cache needs no invalidation — the Map is discarded
    // when the React async context (request) completes.
  }

  /* ------------------------------------------------------------------ */
  /* Private — core implementations (called by the cache wrappers)       */
  /* ------------------------------------------------------------------ */

  private async _buildContextCore(userId: string): Promise<AuthorizationContext> {
    const mem = await this.resolveUserMembership(userId)

    if (mem.isSuperAdmin) {
      return new AuthorizationContext({
        permissionSet: new SuperAdminPermissionSet(userId, mem.id, ''),
      })
    }

    const roleCode = toRoleCode(mem.role)
    const roleId   = await this.resolveRoleId(roleCode)

    const [granted, overrides] = await Promise.all([
      this.fetchRolePermissions(roleId),
      this.fetchPermissionOverrides(mem.neighborhoodId, roleId),
    ])

    return new AuthorizationContext({
      permissionSet: new StandardPermissionSet(
        userId, mem.id, mem.neighborhoodId, roleId, roleCode, this.merge(granted, overrides)
      ),
    })
  }

  private async _loadPermissionsCore(
    userId:         string,
    neighborhoodId: string
  ): Promise<PermissionSet> {
    // SUPER_ADMIN check — any SUPER_ADMIN membership bypasses all permission rules
    const superAdminMembershipId = await this.checkSuperAdmin(userId)
    if (superAdminMembershipId !== null) {
      return new SuperAdminPermissionSet(userId, superAdminMembershipId, neighborhoodId)
    }

    const membership = await this.resolveMembership(userId, neighborhoodId)
    const roleCode   = toRoleCode(membership.role)
    const roleId     = await this.resolveRoleId(roleCode)

    const [granted, overrides] = await Promise.all([
      this.fetchRolePermissions(roleId),
      this.fetchPermissionOverrides(neighborhoodId, roleId),
    ])

    const effective = this.merge(granted, overrides)

    return new StandardPermissionSet(
      userId, membership.id, neighborhoodId, roleId, roleCode, effective
    )
  }

  /* ------------------------------------------------------------------ */
  /* Private — unified membership resolution (used by _buildContextCore) */
  /* ------------------------------------------------------------------ */

  /**
   * Single query that resolves everything _buildContextCore needs from memberships:
   * membership id, role enum, and rt_id. Detects SUPER_ADMIN in the result set
   * so the caller never issues a second round-trip for the SA check.
   */
  private async resolveUserMembership(userId: string): Promise<{
    id:             string
    role:           string
    neighborhoodId: string
    isSuperAdmin:   boolean
  }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.db as any)
      .from('memberships')
      .select('id, role, rt_id')
      .eq('user_id', userId)
      .eq('status', 'active')

    if (error) throw error

    const rows = (data ?? []) as Array<{ id: string; role: string; rt_id: string | null }>

    const sa = rows.find(r => r.role === 'SUPER_ADMIN')
    if (sa) return { id: sa.id, role: 'SUPER_ADMIN', neighborhoodId: '', isSuperAdmin: true }

    const rt = rows.find(r => r.rt_id !== null)
    if (!rt) throw new MembershipNotFoundError(userId, '')

    return { id: rt.id, role: rt.role, neighborhoodId: rt.rt_id!, isSuperAdmin: false }
  }

  /* ------------------------------------------------------------------ */
  /* Private — neighborhood resolution                                   */
  /* ------------------------------------------------------------------ */

  /**
   * Returns the rt_id of the user's first active RT membership.
   * For SUPER_ADMIN the rt_id is NULL in the database; returns '' to signal
   * platform-level context (no RT constraint).
   */
  private async loadUserNeighborhood(userId: string): Promise<string> {
    // SUPER_ADMIN: no RT constraint — return empty string as sentinel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: saData } = await (this.db as any)
      .from('memberships')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'SUPER_ADMIN')
      .maybeSingle()

    if (saData) return ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.db as any)
      .from('memberships')
      .select('rt_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .not('rt_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (error) throw error
    if (!data?.rt_id) throw new MembershipNotFoundError(userId, '')

    return data.rt_id as string
  }

  /* ------------------------------------------------------------------ */
  /* Private — permission resolution                                     */
  /* ------------------------------------------------------------------ */

  /**
   * Returns the membership ID if the user has a SUPER_ADMIN membership,
   * or null otherwise.
   */
  private async checkSuperAdmin(userId: string): Promise<string | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (this.db as any)
      .from('memberships')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'SUPER_ADMIN')
      .maybeSingle()

    return (data as { id: string } | null)?.id ?? null
  }

  private async resolveMembership(
    userId:         string,
    neighborhoodId: string
  ): Promise<MembershipRoleRow> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.db as any)
      .from('memberships')
      .select('id, role')
      .eq('user_id', userId)
      .eq('rt_id', neighborhoodId)
      .eq('status', 'active')
      .maybeSingle()

    if (error) throw error
    if (!data)  throw new MembershipNotFoundError(userId, neighborhoodId)

    return data as MembershipRoleRow
  }

  private async resolveRoleId(roleCode: string): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.db as any)
      .from('roles')
      .select('id')
      .eq('code', roleCode)
      .maybeSingle()

    if (error) throw error
    if (!data)  throw new RoleNotFoundError(roleCode)

    return (data as RoleRow).id
  }

  /** Returns the set of permissions granted by default to this role. */
  private async fetchRolePermissions(roleId: string): Promise<Permission[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.db as any)
      .from('role_permissions')
      .select('allow, permissions(code)')
      .eq('role_id', roleId)
      .eq('allow', true)

    if (error) throw error

    return ((data ?? []) as RolePermissionRow[])
      .map(row => row.permissions.code as Permission)
      .filter(Boolean)
  }

  /**
   * Returns a map of permission code → effective allow flag for all
   * RT-specific overrides for this (neighborhood, role) combination.
   */
  private async fetchPermissionOverrides(
    neighborhoodId: string,
    roleId:         string
  ): Promise<Map<Permission, boolean>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.db as any)
      .from('rt_permission_overrides')
      .select('allow, permissions(code)')
      .eq('rt_id', neighborhoodId)
      .eq('role_id', roleId)

    if (error) throw error

    const overrides = new Map<Permission, boolean>()
    for (const row of (data ?? []) as OverrideRow[]) {
      overrides.set(row.permissions.code as Permission, row.allow)
    }
    return overrides
  }

  /**
   * Merges role defaults with RT overrides.
   * Override allow=true  → adds permission even if absent from role defaults.
   * Override allow=false → removes permission even if present in role defaults.
   */
  private merge(
    granted:   Permission[],
    overrides: Map<Permission, boolean>
  ): ReadonlySet<Permission> {
    const effective = new Set<Permission>(granted)

    for (const [permission, allow] of overrides) {
      if (allow) {
        effective.add(permission)
      } else {
        effective.delete(permission)
      }
    }

    return effective as ReadonlySet<Permission>
  }
}

/* -------------------------------------------------------------------------- */
/* Singleton                                                                   */
/* -------------------------------------------------------------------------- */

/** Server-side singleton. Uses the service-role client to bypass RLS on memberships. */
export const permissionService = new PermissionService(supabaseAdmin)
