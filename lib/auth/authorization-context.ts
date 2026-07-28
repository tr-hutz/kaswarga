/*
 * RBAC v2 — AuthorizationContext
 *
 * Immutable, request-scoped object that represents all authorization
 * information for a single user within a single request. Constructed once
 * by PermissionService and passed into every Business Service.
 *
 * Business Services must never query permission tables directly; they call
 * the helper methods on this context instead.
 *
 * Reference: docs/architecture/AUTHORIZATION_ARCHITECTURE.md
 *            docs/architecture/PERMISSION_SERVICE.md
 */

import type { AuthorizationContextParams, Permission } from './types'

export class AuthorizationContext {

  readonly userId:         string
  readonly neighborhoodId: string
  readonly roleCode:       string
  readonly permissions:    ReadonlySet<Permission>
  readonly locale:         string
  readonly timezone:       string
  readonly requestId:      string

  constructor(params: AuthorizationContextParams) {
    this.userId         = params.userId
    this.neighborhoodId = params.neighborhoodId
    this.roleCode       = params.roleCode
    this.permissions    = params.permissions
    this.locale         = params.locale
    this.timezone       = params.timezone
    this.requestId      = params.requestId
    Object.freeze(this)
  }

  // TODO(Task 2.2): implement — return true when this.permissions contains permission
  can(_permission: Permission): boolean {
    throw new Error('AuthorizationContext.can — not yet implemented')
  }

  // TODO(Task 2.2): implement — return true when any of permissions is granted
  canAny(..._permissions: Permission[]): boolean {
    throw new Error('AuthorizationContext.canAny — not yet implemented')
  }

  // TODO(Task 2.2): implement — return true when all of permissions are granted
  canAll(..._permissions: Permission[]): boolean {
    throw new Error('AuthorizationContext.canAll — not yet implemented')
  }

  // TODO(Task 2.2): implement — return true when userId === this.userId
  isSelf(_userId: string): boolean {
    throw new Error('AuthorizationContext.isSelf — not yet implemented')
  }

  // TODO(Task 2.2): implement — return true when neighborhoodId === this.neighborhoodId
  isSameNeighborhood(_neighborhoodId: string): boolean {
    throw new Error('AuthorizationContext.isSameNeighborhood — not yet implemented')
  }
}
