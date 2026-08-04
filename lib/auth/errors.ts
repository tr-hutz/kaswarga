/*
 * RBAC v2 — Authorization Errors
 *
 * All authorization-related errors thrown by PermissionService and
 * AuthorizationContext. Business Services must catch these and convert them
 * to appropriate HTTP responses.
 *
 * Reference: docs/architecture/AUTHORIZATION_PIPELINE.md (Error Flow)
 */

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/** Thrown when identity cannot be established (HTTP 401). */
export class UnauthorizedError extends AuthorizationError {
  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

/** Thrown when the authenticated user lacks the required permission (HTTP 403). */
export class ForbiddenError extends AuthorizationError {
  readonly permission?: string

  constructor(permission?: string) {
    super(
      permission
        ? `Permission denied: ${permission}`
        : 'Permission denied'
    )
    this.name = 'ForbiddenError'
    this.permission = permission
  }
}

/** Thrown when PermissionService cannot resolve a valid role for the user. */
export class UnknownRoleError extends AuthorizationError {
  constructor(userId: string) {
    super(`Cannot resolve role for user: ${userId}`)
    this.name = 'UnknownRoleError'
  }
}

/** Thrown when PermissionService cannot find the user record. */
export class UnknownUserError extends AuthorizationError {
  constructor(userId: string) {
    super(`User not found: ${userId}`)
    this.name = 'UnknownUserError'
  }
}

/** Thrown when no active membership exists for (userId, neighborhoodId). */
export class MembershipNotFoundError extends AuthorizationError {
  constructor(userId: string, neighborhoodId: string) {
    super(`No active membership for user ${userId} in RT ${neighborhoodId}`)
    this.name = 'MembershipNotFoundError'
  }
}

/** Thrown when the role code resolved from the membership is not in the roles table. */
export class RoleNotFoundError extends AuthorizationError {
  constructor(roleCode: string) {
    super(`Role not found: ${roleCode}`)
    this.name = 'RoleNotFoundError'
  }
}
