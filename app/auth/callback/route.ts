import { NextResponse }      from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies }            from 'next/headers'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL      || 'https://bftwjxpotkmpofdruiqc.supabase.co'
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_9S7keXBfOvJqzVOBRIxK4w_pjQ2UhXt'

/*
|--------------------------------------------------------------------------
| GET /auth/callback
|
| Supabase PKCE callback — exchanges the one-time `code` query param for a
| session, writes it to cookies, then redirects to /aktivasi.
|
| All invite and magic-link redirectTo values must point here so that the
| session is established server-side before the activation page loads.
|--------------------------------------------------------------------------
*/
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code  = searchParams.get('code')
    const next  = searchParams.get('next') ?? '/aktivasi'

    if (code) {
        const cookieStore = await cookies()
        const supabase    = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
            cookies: {
                getAll()             { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {}
                }
            }
        })

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }

        console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    }

    return NextResponse.redirect(`${origin}/aktivasi?error=link_invalid`)
}
