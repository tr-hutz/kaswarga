import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/*
|--------------------------------------------------------------------------
| POST /api/resend-invite
|
| Body: { email }
|
| Finds the latest activation invite for that email, re-sends the invite
| link, and inserts a new activation_invites row with a fresh 1-day expiry.
|--------------------------------------------------------------------------
*/

export async function POST(req: Request) {
    try {
        const { email } = await req.json()

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 })
        }

        // Find latest invite for this email
        const { data: invite, error: fetchError } = await supabaseAdmin
            .from('activation_invites')
            .select('*')
            .eq('email', email)
            .is('activated_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (fetchError || !invite) {
            return NextResponse.json({ error: 'No invite found for this email' }, { status: 404 })
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const redirectTo = `${siteUrl}/aktivasi`

        // Try invite first, fall back to magic link for existing users
        const { error: err1 } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo })

        if (err1) {
            const { error: err2 } = await supabaseAdmin.auth.admin.generateLink({
                type:    'magiclink',
                email,
                options: { redirectTo }
            })
            if (err2) {
                console.error('[resend-invite] send error:', err2)
                return NextResponse.json({ error: err2.message }, { status: 500 })
            }
        }

        // Insert new invite row with fresh 1-day expiry
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        await supabaseAdmin.from('activation_invites').insert({
            registration_request_id: invite.registration_request_id,
            email:         invite.email,
            role:          invite.role,
            rt_id:         invite.rt_id,
            expires_at:    expiresAt,
            resend_count:  invite.resend_count + 1
        })

        return NextResponse.json({ ok: true })

    } catch (err) {
        console.error('[resend-invite] unexpected error:', err)
        return NextResponse.json({ error: (err as Error).message }, { status: 500 })
    }
}
