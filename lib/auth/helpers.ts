/*
 * RBAC v2 — Authorization Helpers
 *
 * Stateless functions that standardize permission checks for Business Services.
 * All functions delegate to AuthorizationContext — no database access, no
 * framework dependency.
 *
 * Usage:
 *   import { requirePermission, hasPermission } from '@/lib/auth/helpers'
 *   import { PERMISSION } from '@/lib/auth'
 *
 *   // In a Server Action:
 *   const ctx = await getRequestContext()
 *   requirePermission(ctx.authorization, PERMISSION.PAYMENT_APPROVE)
 *
 * Reference: docs/architecture/AUTHORIZATION_ARCHITECTURE.md
 */

import type { AuthorizationContext } from './authorization-context'
import { ForbiddenError }            from './errors'
import type { Permission }           from './types'

/* -------------------------------------------------------------------------- */
/* Read-only checks — never throw                                              */
/* -------------------------------------------------------------------------- */

/** Returns true when the context holds the given permission. */
export function hasPermission(
  context:    AuthorizationContext,
  permission: Permission
): boolean {
  return context.hasPermission(permission)
}

/** Returns true when the context holds at least one of the given permissions. */
export function hasAnyPermission(
  context:     AuthorizationContext,
  permissions: Permission[]
): boolean {
  return context.hasAny(...permissions)
}

/** Returns true only when the context holds every given permission. */
export function hasAllPermissions(
  context:     AuthorizationContext,
  permissions: Permission[]
): boolean {
  return context.hasAll(...permissions)
}

/* -------------------------------------------------------------------------- */
/* Enforcement — throw ForbiddenError when the check fails                    */
/* -------------------------------------------------------------------------- */

/**
 * Throws ForbiddenError when the context does not hold the given permission.
 * Call this at the start of a Business Service method before executing logic.
 */
export function requirePermission(
  context:    AuthorizationContext,
  permission: Permission
): void {
  if (!context.hasPermission(permission)) {
    throw new ForbiddenError(permission)
  }
}

/**
 * Throws ForbiddenError when the context holds none of the given permissions.
 * Use when any one of several permissions is sufficient to proceed.
 */
export function requireAnyPermission(
  context:     AuthorizationContext,
  permissions: Permission[]
): void {
  if (!context.hasAny(...permissions)) {
    throw new ForbiddenError(permissions.join(' | '))
  }
}

/**
 * Throws ForbiddenError when the context is missing any of the given permissions.
 * Use when all listed permissions are required simultaneously.
 */
export function requireAllPermissions(
  context:     AuthorizationContext,
  permissions: Permission[]
): void {
  const missing = permissions.find(p => !context.hasPermission(p))
  if (missing !== undefined) {
    throw new ForbiddenError(missing)
  }
}
