import { NextResponse }      from 'next/server'
import type { NextRequest }  from 'next/server'
import { createServerClient } from '@supabase/ssr'

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true'

// These paths are always allowed through, even during maintenance
const ALWAYS_ALLOW = [
    '/maintenance',
    '/api/activate',
    '/api/resend-invite',
]

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // Create a response that will carry any refreshed session cookies back to
    // the browser. This must be done on every request — even in normal mode —
    // so that the auth token in the cookie stays valid for server-side reads
    // (e.g. getRequestContext() in Server Actions and Route Handlers).
    const response = NextResponse.next({ request })

    const userClient = createServerClient(supabaseUrl, anonKey, {
        cookies: {
            getAll:  () => request.cookies.getAll(),
            setAll:  (cs) => cs.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
            ),
        },
    })

    // getUser() refreshes the access token when it is about to expire and
    // stores the new token in the response cookies above.
    const { data: { user } } = await userClient.auth.getUser()

    if (!MAINTENANCE_MODE) return response

    if (ALWAYS_ALLOW.some(p => pathname === p || pathname.startsWith(p + '/'))) {
        return response
    }

    // Check if the requesting user is a SUPER_ADMIN — if so, bypass maintenance
    try {
        if (user) {
            const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!
            const adminClient = createServerClient(supabaseUrl, serviceKey, {
                cookies: { getAll: () => [], setAll: () => {} },
            })

            const { data: membership } = await adminClient
                .from('memberships')
                .select('role')
                .eq('user_id', user.id)
                .eq('role', 'SUPER_ADMIN')
                .maybeSingle()

            if (membership) return response
        }
    } catch {
        // On any error fall through to the maintenance redirect
    }

    return NextResponse.redirect(new URL('/maintenance', request.url))
}

export const config = {
    // Run on all routes except Next.js internals and static assets
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
