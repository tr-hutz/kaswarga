/*
 * RBAC v2 — RequestContext
 *
 * Root runtime object for every incoming request. Contains all request-scoped
 * information required by Business Services: identity, authorization,
 * localization, and tracing metadata.
 *
 * Business Services receive exactly one RequestContext per call.
 * It is created by createRequestContext() and must never be constructed
 * directly inside a Business Service.
 *
 * Design
 *   - Immutable: Object.freeze prevents mutation after construction
 *   - Delegation: userId / membershipId / neighborhoodId are convenience
 *     getters that delegate to authorization — no data duplication
 *   - Extensible: new request-scoped objects (AuditContext, FeatureFlagContext)
 *     can be added as constructor params without breaking existing call sites
 *
 * Reference: docs/architecture/REQUEST_CONTEXT.md
 *            docs/architecture/AUTHORIZATION_PIPELINE.md
 */

import { randomUUID } from 'crypto'

import type { AuthorizationContext } from './authorization-context'
import { permissionService }         from './permission-service'

/* -------------------------------------------------------------------------- */
/* RequestContext                                                              */
/* -------------------------------------------------------------------------- */

export interface RequestContextParams {
  readonly requestId:     string
  readonly locale:        string
  readonly timezone:      string
  readonly ipAddress:     string
  readonly userAgent:     string
  readonly authorization: AuthorizationContext
}

export class RequestContext {

  /** Unique identifier for this request — include in every log entry. */
  readonly requestId: string

  /** BCP-47 locale tag (e.g. 'id', 'en-US') derived from Accept-Language. */
  readonly locale: string

  /** IANA timezone identifier (e.g. 'Asia/Jakarta') for date formatting. */
  readonly timezone: string

  /** Client IP address extracted from X-Forwarded-For (empty string when absent). */
  readonly ipAddress: string

  /** Raw User-Agent header value (empty string when absent). */
  readonly userAgent: string

  /** Resolved authorization context — the single source of truth for permissions. */
  readonly authorization: AuthorizationContext

  constructor(params: RequestContextParams) {
    this.requestId     = params.requestId
    this.locale        = params.locale
    this.timezone      = params.timezone
    this.ipAddress     = params.ipAddress
    this.userAgent     = params.userAgent
    this.authorization = params.authorization
    Object.freeze(this)
  }

  /* ------------------------------------------------------------------ */
  /* Convenience getters — delegate to authorization                     */
  /* ------------------------------------------------------------------ */

  /** Supabase Auth UUID of the authenticated user. */
  get userId(): string { return this.authorization.userId }

  /** Primary key of the memberships row backing this context. */
  get membershipId(): string { return this.authorization.membershipId }

  /** UUID of the RT (neighborhood) this request is scoped to. */
  get neighborhoodId(): string { return this.authorization.neighborhoodId }
}

/* -------------------------------------------------------------------------- */
/* Factory                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Constructs a fully resolved RequestContext for the authenticated user.
 *
 * Calls PermissionService to resolve the user's effective permissions and
 * wraps the result in a RequestContext with metadata extracted from the
 * incoming HTTP request headers.
 *
 * Throws MembershipNotFoundError or RoleNotFoundError when the user has
 * no valid authorization context (bubble up to the authentication layer).
 */
export async function createRequestContext(
  userId:   string,
  request?: { headers: Headers }
): Promise<RequestContext> {
  const authorization = await permissionService.buildContext(userId)

  const headers = request?.headers

  return new RequestContext({
    requestId:     randomUUID(),
    locale:        extractLocale(headers),
    timezone:      extractTimezone(headers),
    ipAddress:     extractIpAddress(headers),
    userAgent:     headers?.get('user-agent') ?? '',
    authorization,
  })
}

/**
 * Returns a pre-populated RequestContext for use in unit tests.
 * Allows overriding individual fields without constructing a real context.
 *
 * TODO(Task 2.6): implement with sensible defaults and per-field overrides.
 */
export function createMockRequestContext(
  _overrides?: Partial<RequestContextParams>
): RequestContext {
  throw new Error('createMockRequestContext — not yet implemented (Task 2.6)')
}

/* -------------------------------------------------------------------------- */
/* Header extraction helpers                                                  */
/* -------------------------------------------------------------------------- */

function extractLocale(headers?: Headers): string {
  const raw = headers?.get('accept-language')
  if (!raw) return 'id'
  // 'id,en-US;q=0.9,en;q=0.8' → 'id'
  const first = raw.split(',')[0]?.split(';')[0]?.trim()
  return first || 'id'
}

function extractTimezone(headers?: Headers): string {
  return headers?.get('x-timezone') ?? 'Asia/Jakarta'
}

function extractIpAddress(headers?: Headers): string {
  const forwarded = headers?.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? ''
  return headers?.get('x-real-ip') ?? ''
}
