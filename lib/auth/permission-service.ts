/*
 * RBAC v2 — PermissionService
 *
 * The only application component permitted to resolve permissions from the
 * database. Queries role_permissions + rt_permission_overrides, merges them
 * into an effective permission set, and returns a PermissionSet for the caller.
 *
 * Design
 *   - Stateless: no mutable instance state between calls
 *   - Dependency-injected: the Supabase client is supplied via the constructor
 *   - Cache-ready: caching hooks are no-ops now; Task 2.4 adds the real layer
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

import type { SupabaseClient } from '@supabase/supabase-js'

import { supabaseAdmin }             from '../supabase-admin'
import type { AuthorizationContext } from './authorization-context'
import { MembershipNotFoundError, RoleNotFoundError } from './errors'
import { PERMISSION, type Permission }                from './types'

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
 * Will be embedded inside AuthorizationContext in Task 2.3.
 */
export interface PermissionSet {
  readonly userId:         string
  readonly neighborhoodId: string
  readonly roleCode:       string

  /** Returns true when the user holds this permission. */
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
  readonly neighborhoodId: string
  readonly roleCode:       string
  private readonly _permissions: ReadonlySet<Permission>

  constructor(
    userId:         string,
    neighborhoodId: string,
    roleCode:       string,
    permissions:    ReadonlySet<Permission>
  ) {
    this.userId         = userId
    this.neighborhoodId = neighborhoodId
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

/* SUPER_ADMIN override — bypasses all permission checks */
class SuperAdminPermissionSet implements PermissionSet {
  readonly userId:         string
  readonly neighborhoodId: string
  readonly roleCode = 'SUPER_ADMIN'

  constructor(userId: string, neighborhoodId: string) {
    this.userId         = userId
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
  /* Public API                                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Loads the effective permissions for a user in a specific RT.
   *
   * Throws MembershipNotFoundError when no active membership exists.
   * Throws RoleNotFoundError when the role from memberships has no matching
   * row in the roles table (indicates a data configuration issue).
   */
  async loadPermissions(
    userId:         string,
    neighborhoodId: string
  ): Promise<PermissionSet> {
    // SUPER_ADMIN check — any SUPER_ADMIN membership bypasses all permission rules
    const isSuperAdmin = await this.checkSuperAdmin(userId)
    if (isSuperAdmin) {
      return new SuperAdminPermissionSet(userId, neighborhoodId)
    }

    const membership = await this.resolveMembership(userId, neighborhoodId)
    const roleCode   = toRoleCode(membership.role)
    const roleId     = await this.resolveRoleId(roleCode)

    const [granted, overrides] = await Promise.all([
      this.fetchRolePermissions(roleId),
      this.fetchPermissionOverrides(neighborhoodId, roleId),
    ])

    const effective = this.merge(granted, overrides)

    return new StandardPermissionSet(userId, neighborhoodId, roleCode, effective)
  }

  /**
   * TODO(Task 2.3): build a fully initialized AuthorizationContext.
   * Requires AuthorizationContext to be implemented first.
   */
  async buildContext(_userId: string): Promise<AuthorizationContext> {
    throw new Error('PermissionService.buildContext — not yet implemented (Task 2.3)')
  }

  /** No-op hook for future cache invalidation (Task 2.4). */
  invalidateCache(_userId: string, _neighborhoodId: string): void {
    // TODO(Task 2.4): remove cached PermissionSet for this (userId, neighborhoodId)
  }

  /* ------------------------------------------------------------------ */
  /* Private — permission resolution                                     */
  /* ------------------------------------------------------------------ */

  private async checkSuperAdmin(userId: string): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (this.db as any)
      .from('memberships')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'SUPER_ADMIN')
      .maybeSingle()

    return data !== null
  }

  private async resolveMembership(
    userId:         string,
    neighborhoodId: string
  ): Promise<MembershipRoleRow> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.db as any)
      .from('memberships')
      .select('role')
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
