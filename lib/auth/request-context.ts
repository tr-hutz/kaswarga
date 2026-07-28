/*
 * RBAC v2 — RequestContext
 *
 * Root runtime object for every incoming request. Contains all request-scoped
 * information required by Business Services: identity, authorization,
 * localization, and tracing metadata.
 *
 * Business Services receive exactly one RequestContext per call.
 * It is created by RequestContextFactory and must never be constructed
 * inside a Business Service.
 *
 * Reference: docs/architecture/REQUEST_CONTEXT.md
 */

import type { AuthorizationContext } from './authorization-context'

export class RequestContext {

  readonly requestId:     string
  readonly locale:        string
  readonly timezone:      string
  readonly ipAddress:     string
  readonly userAgent:     string
  readonly authorization: AuthorizationContext

  constructor(params: {
    requestId:     string
    locale:        string
    timezone:      string
    ipAddress:     string
    userAgent:     string
    authorization: AuthorizationContext
  }) {
    this.requestId     = params.requestId
    this.locale        = params.locale
    this.timezone      = params.timezone
    this.ipAddress     = params.ipAddress
    this.userAgent     = params.userAgent
    this.authorization = params.authorization
    Object.freeze(this)
  }
}

// TODO(Task 2.3): implement — construct RequestContext from Next.js request
export async function createRequestContext(
  _userId: string,
  _request?: { headers: Headers }
): Promise<RequestContext> {
  throw new Error('createRequestContext — not yet implemented')
}

// TODO(Task 2.6): implement — return a pre-filled RequestContext for unit tests
export function createMockRequestContext(
  _overrides?: Partial<ConstructorParameters<typeof RequestContext>[0]>
): RequestContext {
  throw new Error('createMockRequestContext — not yet implemented')
}
