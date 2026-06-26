import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/*
|--------------------------------------------------------------------------
| POST /api/invite
|
| Body: { registrationRequestId, email, role, rtId }
|
| Sends a Supabase invite email and records the activation_invite row.
| Falls back to magic-link generation for users who already have auth accounts.
|--------------------------------------------------------------------------
*/

export async function POST(req) {
    try {
        const { registrationRequestId, email, role, rtId } = await req.json()

        if (!registrationRequestId || !email || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const redirectTo = `${siteUrl}/aktivasi`

        let inviteError = null

        // Try inviteUserByEmail first (works for new users)
        const { error: err1 } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo
        })

        if (err1) {
            // User already exists — send magic link instead
            const { error: err2 } = await supabaseAdmin.auth.admin.generateLink({
                type:       'magiclink',
                email,
                options:    { redirectTo }
            })
            if (err2) inviteError = err2
        }

        if (inviteError) {
            console.error('[invite] send error:', inviteError)
            return NextResponse.json({ error: inviteError.message }, { status: 500 })
        }

        // Record activation invite
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        const { error: insertError } = await supabaseAdmin
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

        return NextResponse.json({ ok: true })

    } catch (err) {
        console.error('[invite] unexpected error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
