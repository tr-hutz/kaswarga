/*
 * RBAC v2 — PermissionService
 *
 * The only application component permitted to resolve permissions from the
 * database. Constructs a fully initialized AuthorizationContext for a given
 * user. Business Services must never call this service after the context
 * has been created.
 *
 * Public API  : buildContext(userId)
 * Private API : resolveRole, loadRolePermissions, loadPermissionOverrides,
 *               mergePermissions, loadUserNeighborhood, loadUserLocale,
 *               loadUserTimezone, invalidateCache
 *
 * Reference: docs/architecture/PERMISSION_SERVICE.md
 */

import type { AuthorizationContext } from './authorization-context'
import type { Permission, RoleCode } from './types'

export class PermissionService {

  /*
   * Resolves all permissions for userId and returns a fully constructed,
   * immutable AuthorizationContext. This is the only public method.
   *
   * Throws UnknownUserError when the user record is not found.
   * Throws UnknownRoleError when no active membership can be resolved.
   *
   * TODO(Task 2.2): implement
   */
  async buildContext(_userId: string): Promise<AuthorizationContext> {
    throw new Error('PermissionService.buildContext — not yet implemented')
  }

  // TODO(Task 2.2): load active membership and return role code
  private async resolveRole(
    _userId: string,
    _neighborhoodId: string
  ): Promise<RoleCode> {
    throw new Error('PermissionService.resolveRole — not yet implemented')
  }

  // TODO(Task 2.2): query role_permissions for the given roleCode
  private async loadRolePermissions(
    _roleCode: RoleCode
  ): Promise<ReadonlySet<Permission>> {
    throw new Error('PermissionService.loadRolePermissions — not yet implemented')
  }

  // TODO(Task 2.2): query rt_permission_overrides for (neighborhoodId, roleCode)
  private async loadPermissionOverrides(
    _neighborhoodId: string,
    _roleCode: RoleCode
  ): Promise<Map<Permission, boolean>> {
    throw new Error('PermissionService.loadPermissionOverrides — not yet implemented')
  }

  // TODO(Task 2.2): merge role defaults with RT overrides into an EffectivePermissions set
  private mergePermissions(
    _rolePermissions: ReadonlySet<Permission>,
    _overrides: Map<Permission, boolean>
  ): ReadonlySet<Permission> {
    throw new Error('PermissionService.mergePermissions — not yet implemented')
  }

  // TODO(Task 2.2): resolve the user's active neighborhood (RT) id
  private async loadUserNeighborhood(_userId: string): Promise<string> {
    throw new Error('PermissionService.loadUserNeighborhood — not yet implemented')
  }

  // TODO(Task 2.2): resolve locale from user profile or request headers
  private async loadUserLocale(_userId: string): Promise<string> {
    throw new Error('PermissionService.loadUserLocale — not yet implemented')
  }

  // TODO(Task 2.2): resolve timezone from user profile or RT settings
  private async loadUserTimezone(_userId: string): Promise<string> {
    throw new Error('PermissionService.loadUserTimezone — not yet implemented')
  }

  // TODO(Task 2.4): invalidate the cached permission resolution for this user+neighborhood
  invalidateCache(_userId: string, _neighborhoodId: string): void {
    // no-op until cache is implemented
  }
}

/** Singleton for use in server-side contexts (API routes, Server Actions). */
export const permissionService = new PermissionService()
