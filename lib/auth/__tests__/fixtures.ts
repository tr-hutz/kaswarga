/**
 * Shared test fixtures for authorization infrastructure unit tests.
 * Import from individual test files — never export from the barrel.
 */

import { vi }                    from 'vitest'
import type { SupabaseClient }   from '@supabase/supabase-js'

import { AuthorizationContext }  from '@/lib/auth/authorization-context'
import { RequestContext }        from '@/lib/auth/request-context'
import type { PermissionSet }    from '@/lib/auth/permission-service'
import type { Permission }       from '@/lib/auth/types'

/* -------------------------------------------------------------------------- */
/* PermissionSet fixture                                                       */
/* -------------------------------------------------------------------------- */

interface PermissionSetOptions {
  userId?:         string
  membershipId?:   string
  neighborhoodId?: string
  roleId?:         string
  roleCode?:       string
}

export function makePermissionSet(
  permissions: Permission[],
  options: PermissionSetOptions = {}
): PermissionSet {
  const set = new Set(permissions)
  return {
    userId:         options.userId         ?? 'user-1',
    membershipId:   options.membershipId   ?? 'membership-1',
    neighborhoodId: options.neighborhoodId ?? 'rt-1',
    roleId:         options.roleId         ?? 'role-1',
    roleCode:       options.roleCode       ?? 'RESIDENT',
    hasPermission:         (code)   => set.has(code),
    hasAny:                (codes)  => codes.some(c => set.has(c)),
    hasAll:                (codes)  => codes.every(c => set.has(c)),
    getEffectivePermissions: ()     => set as ReadonlySet<Permission>,
  }
}

/* -------------------------------------------------------------------------- */
/* AuthorizationContext fixture                                                */
/* -------------------------------------------------------------------------- */

export function makeAuthContext(
  permissions: Permission[],
  options: PermissionSetOptions = {}
): AuthorizationContext {
  return new AuthorizationContext({ permissionSet: makePermissionSet(permissions, options) })
}

/* -------------------------------------------------------------------------- */
/* RequestContext fixture                                                      */
/* -------------------------------------------------------------------------- */

interface RequestContextOptions {
  requestId?:     string
  locale?:        string
  timezone?:      string
  ipAddress?:     string
  userAgent?:     string
  permissions?:   Permission[]
  contextOptions?: PermissionSetOptions
}

export function makeRequestContext(options: RequestContextOptions = {}): RequestContext {
  return new RequestContext({
    requestId:     options.requestId ?? 'req-test-1',
    locale:        options.locale    ?? 'id',
    timezone:      options.timezone  ?? 'Asia/Jakarta',
    ipAddress:     options.ipAddress ?? '127.0.0.1',
    userAgent:     options.userAgent ?? 'test-agent',
    authorization: makeAuthContext(
      options.permissions    ?? [],
      options.contextOptions ?? {}
    ),
  })
}

/* -------------------------------------------------------------------------- */
/* Supabase mock client                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Creates a mock query chain that supports all Supabase builder methods
 * and is directly awaitable (implements `.then()`) for queries without
 * a terminal method like `.maybeSingle()`.
 */
function makeQueryChain(result: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {}
  chain.select     = vi.fn().mockReturnValue(chain)
  chain.eq         = vi.fn().mockReturnValue(chain)
  chain.not        = vi.fn().mockReturnValue(chain)
  chain.limit      = vi.fn().mockReturnValue(chain)
  chain.maybeSingle = vi.fn().mockResolvedValue(result)
  // Make the chain itself awaitable (for direct-await queries like fetchRolePermissions)
  chain.then = (
    resolve: (v: unknown) => unknown,
    reject:  (r: unknown) => unknown
  ) => Promise.resolve(result).then(resolve, reject)
  return chain
}

/**
 * Creates a mock Supabase client where each `.from()` call consumes the
 * next response in the provided sequence.
 *
 * Call order in PermissionService.loadPermissions (non-SUPER_ADMIN):
 *   0 — checkSuperAdmin         (.memberships .select('id') .maybeSingle)
 *   1 — resolveMembership       (.memberships .select('id, role') .maybeSingle)
 *   2 — resolveRoleId           (.roles .maybeSingle)
 *   3 — fetchRolePermissions    (.role_permissions, direct await)
 *   4 — fetchPermissionOverrides(.rt_permission_overrides, direct await)
 */
export function makeSupabaseClient(
  responses: Array<{ data: unknown; error: unknown }>
): SupabaseClient {
  let callIndex = 0
  return {
    from: vi.fn().mockImplementation(() => {
      const result = responses[callIndex] ?? { data: null, error: null }
      callIndex++
      return makeQueryChain(result)
    }),
  } as unknown as SupabaseClient
}
