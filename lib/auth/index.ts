/*
 * RBAC v2 — lib/auth public API
 *
 * All RBAC v2 infrastructure is re-exported from this single entry point.
 * Import exclusively from '@/lib/auth', never from individual files.
 */

export { getRequestContext }        from './server'
export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
}                                   from './helpers'
export { AuthorizationContext }    from './authorization-context'
export type { AuthorizationContextInput } from './authorization-context'
export { RequestContext,
         createRequestContext,
         createMockRequestContext } from './request-context'
export type { RequestContextParams }  from './request-context'
export { PermissionService,
         permissionService }        from './permission-service'
export type { PermissionSet }       from './permission-service'
export {
  AuthorizationError,
  UnauthorizedError,
  ForbiddenError,
  UnknownRoleError,
  UnknownUserError,
  MembershipNotFoundError,
  RoleNotFoundError,
}                                   from './errors'
export {
  PERMISSION,
  ROLE_CODE,
}                                   from './types'
export type {
  Permission,
  RoleCode,
  EffectivePermissions,
}                                   from './types'
