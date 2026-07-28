/*
 * RBAC v2 — lib/auth public API
 *
 * All RBAC v2 infrastructure is re-exported from this single entry point.
 * Import exclusively from '@/lib/auth', never from individual files.
 */

export { AuthorizationContext }    from './authorization-context'
export { RequestContext,
         createRequestContext,
         createMockRequestContext } from './request-context'
export { PermissionService,
         permissionService }        from './permission-service'
export {
  AuthorizationError,
  UnauthorizedError,
  ForbiddenError,
  UnknownRoleError,
  UnknownUserError,
}                                   from './errors'
export {
  PERMISSION,
  ROLE_CODE,
}                                   from './types'
export type {
  Permission,
  RoleCode,
  EffectivePermissions,
  AuthorizationContextParams,
  RequestContextParams,
}                                   from './types'
