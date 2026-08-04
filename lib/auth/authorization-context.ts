/*
 * RBAC v2 — AuthorizationContext
 *
 * Immutable value object representing a fully resolved authorization snapshot
 * for a single user within a single request. Created by
 * PermissionService.buildContext() — never instantiated directly in business code.
 *
 * Design
 *   - All permission checks delegate to the embedded PermissionSet (the source
 *     of truth for what the user can do in their RT).
 *   - Identity helpers (isSelf, isSameNeighborhood) are evaluated inline.
 *   - Object.freeze ensures the context cannot be mutated after construction.
 *   - Localization / tracing fields (locale, timezone, requestId) are carried
 *     by RequestContext (Task 2.4), not here, to keep authorization concerns
 *     separate from request concerns.
 *
 * Reference: docs/architecture/AUTHORIZATION_ARCHITECTURE.md
 */

import type { PermissionSet } from './permission-service'
import type { Permission }    from './types'

/* -------------------------------------------------------------------------- */
/* Constructor input                                                           */
/* -------------------------------------------------------------------------- */

export interface AuthorizationContextInput {
  readonly permissionSet: PermissionSet
}

/* -------------------------------------------------------------------------- */
/* AuthorizationContext                                                        */
/* -------------------------------------------------------------------------- */

export class AuthorizationContext {

  /** Supabase Auth UUID of the authenticated user. */
  readonly userId: string

  /** Primary key of the memberships row that backs this context. */
  readonly membershipId: string

  /** UUID of the RT (neighborhood) this context is scoped to. */
  readonly neighborhoodId: string

  /** UUID of the roles table row for the resolved role. */
  readonly roleId: string

  /** Canonical role code from the roles table (e.g. 'RT_CHAIR', 'RESIDENT'). */
  readonly roleCode: string

  private readonly _permissionSet: PermissionSet

  constructor(input: AuthorizationContextInput) {
    const ps = input.permissionSet

    this.userId         = ps.userId
    this.membershipId   = ps.membershipId
    this.neighborhoodId = ps.neighborhoodId
    this.roleId         = ps.roleId
    this.roleCode       = ps.roleCode

    this._permissionSet = ps
    Object.freeze(this)
  }

  /* ------------------------------------------------------------------ */
  /* Permission checks                                                   */
  /* ------------------------------------------------------------------ */

  /** Returns true when the user holds the given permission. */
  hasPermission(code: Permission): boolean {
    return this._permissionSet.hasPermission(code)
  }

  /** Returns true when the user holds at least one of the given permissions. */
  hasAny(...permissions: Permission[]): boolean {
    return this._permissionSet.hasAny(permissions)
  }

  /** Returns true only when the user holds every one of the given permissions. */
  hasAll(...permissions: Permission[]): boolean {
    return this._permissionSet.hasAll(permissions)
  }

  /** Returns the full effective permission set (for inspection / debug). */
  getPermissions(): ReadonlySet<Permission> {
    return this._permissionSet.getEffectivePermissions()
  }

  /* ------------------------------------------------------------------ */
  /* Identity helpers                                                    */
  /* ------------------------------------------------------------------ */

  /** Returns true when the given userId matches this context's identity. */
  isSelf(userId: string): boolean {
    return this.userId === userId
  }

  /** Returns true when the given neighborhoodId matches this context's RT. */
  isSameNeighborhood(neighborhoodId: string): boolean {
    return this.neighborhoodId === neighborhoodId
  }
}
