import { NextResponse }       from 'next/server'
import { cookies }             from 'next/headers'
import { createServerClient }  from '@supabase/ssr'
import { supabaseAdmin }       from '@/lib/supabase-admin'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      || 'https://bftwjxpotkmpofdruiqc.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_9S7keXBfOvJqzVOBRIxK4w_pjQ2UhXt'

/*
|--------------------------------------------------------------------------
| POST /api/invite
|
| Body: { registrationRequestId, email, role, rtId }
|
| Sends a Supabase invite email and records the activation_invite row.
| Falls back to magic-link generation for users who already have auth accounts.
|
| Auth invite is non-fatal in development — the activation_invites DB row is
| what matters for the activation flow; the email/link is a delivery mechanism.
|--------------------------------------------------------------------------
*/

export async function POST(req) {
    try {
        const { registrationRequestId, email, role, rtId } = await req.json()

        if (!registrationRequestId || !email || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const redirectTo = `${siteUrl}/aktivasi`

        // ----------------------------------------------------------------
        // Send auth invite / generate link
        // In development this is non-fatal and returns the link in the
        // response so the UI can display it directly.
        // In production a failure IS fatal because the user needs the email.
        // ----------------------------------------------------------------
        let devLink = null

        try {
            if (process.env.NODE_ENV === 'development') {
                const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
                    type:    'invite',
                    email,
                    options: { redirectTo }
                })

                if (linkErr) {
                    // User already exists — fall back to magic link
                    const { data: mlData, error: mlErr } = await supabaseAdmin.auth.admin.generateLink({
                        type:    'magiclink',
                        email,
                        options: { redirectTo }
                    })
                    if (mlErr) {
                        console.warn(`[invite] could not generate link for ${email}:`, mlErr.message)
                    } else {
                        devLink = mlData.properties?.action_link
                    }
                } else {
                    devLink = linkData.properties?.action_link
                }
            } else {
                // Production: send real invite email
                const { error: err1 } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo })

                if (err1) {
                    // User already exists — send magic link instead
                    const { error: err2 } = await supabaseAdmin.auth.admin.generateLink({
                        type:    'magiclink',
                        email,
                        options: { redirectTo }
                    })
                    if (err2) throw err2
                }
            }
        } catch (authErr) {
            if (process.env.NODE_ENV !== 'development') {
                console.error('[invite] auth error:', authErr)
                return NextResponse.json({ error: authErr.message }, { status: 500 })
            }
            console.warn('[invite] auth error (non-fatal in dev):', authErr.message)
        }

        // ----------------------------------------------------------------
        // Record activation invite using the caller's session (RLS-safe).
        // This is the record the /aktivasi page reads — it must always be
        // written regardless of whether the auth link generation succeeded.
        // ----------------------------------------------------------------
        const cookieStore = await cookies()
        const supabase    = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            cookies: {
                getAll()                { return cookieStore.getAll() },
                setAll(cookiesToSet)    {
                    try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
                    catch {}
                }
            }
        })

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        const { error: insertError } = await supabase
            .from('activation_invites')
            .insert({
                registration_request_id: registrationRequestId,
                email,
                role,
                rt_id:      rtId || null,
                expires_at: expiresAt
            })

        if (insertError) {
            console.error('[invite] insert error:', insertError)
            return NextResponse.json({ error: insertError.message }, { status: 500 })
        }

        return NextResponse.json({ ok: true, ...(devLink ? { devLink } : {}) })

    } catch (err) {
        console.error('[invite] unexpected error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}