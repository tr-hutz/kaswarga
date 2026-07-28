/*
 * RBAC v2 — Server-side Authorization Middleware
 *
 * This module is the authorization layer between authentication and Business
 * Services. It must only be imported in server contexts (Server Components,
 * Server Actions, Route Handlers). Never import it from client components.
 *
 * Usage in a Server Action or Route Handler:
 *
 *   import { getRequestContext } from '@/lib/auth/server'
 *
 *   export async function approvePayment(paymentId: string) {
 *     const ctx = await getRequestContext()
 *     if (!ctx.authorization.hasPermission(PERMISSION.PAYMENT_APPROVE)) {
 *       throw new ForbiddenError(PERMISSION.PAYMENT_APPROVE)
 *     }
 *     // ... business logic
 *   }
 *
 * Design
 *   - Memoized with React.cache() so PermissionService is invoked exactly
 *     once per request, regardless of how many Server Actions or Components
 *     call getRequestContext() within the same request scope.
 *   - Uses getUser() (live Supabase server call) — never getSession() —
 *     so the token is always validated against the auth server, not just
 *     read from the cookie store.
 *   - Cookie-setting is intentionally disabled here; the proxy middleware
 *     (proxy.ts) handles session refresh before the request reaches this layer.
 *
 * Reference: docs/architecture/REQUEST_CONTEXT.md
 *            docs/architecture/AUTHORIZATION_PIPELINE.md
 */

import { cache }                from 'react'
import { cookies, headers }     from 'next/headers'
import { createServerClient }   from '@supabase/ssr'

import { createRequestContext } from './request-context'
import { UnauthorizedError }    from './errors'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Returns the RequestContext for the current server-side request.
 *
 * Memoized with React.cache() — safe to call multiple times in the same
 * request; PermissionService is only invoked once.
 *
 * Throws UnauthorizedError (HTTP 401) when no valid session is found.
 * Throws MembershipNotFoundError when the authenticated user has no
 * active RT membership (bubble up to the calling handler).
 */
export const getRequestContext = cache(async () => {
  const cookieStore = await cookies()
  const headerStore = await headers()

  // Read-only server client — session refresh is handled upstream in proxy.ts
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  })

  // getUser() validates the access token against the Supabase auth server.
  // This is the only secure way to get the user server-side.
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) throw new UnauthorizedError()

  return createRequestContext(user.id, { headers: headerStore })
})
