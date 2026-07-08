import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/*
|--------------------------------------------------------------------------
| POST /api/dev/invite-link   ⚠️  DEVELOPMENT ONLY
|
| Generates an activation link and returns it directly — no email sent.
| Use this to test the registration → activation flow without needing
| a real email inbox.
|
| Body:
|   email                  string   required
|   role                   string   required  (CHAIR|ADMIN|TREASURER|RESIDENT)
|   rtId                   string   optional  UUID of the RT
|   registrationRequestId  string   optional  inserts activation_invites row
|
| Response:
|   { link, email, role }
|
| Example (curl):
|   curl -X POST http://localhost:3000/api/dev/invite-link \
|     -H "Content-Type: application/json" \
|     -d '{"email":"test@example.com","role":"RESIDENT","rtId":"11111111-1111-1111-1111-111111111111"}'
|--------------------------------------------------------------------------
*/

export async function POST(req: Request) {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
    }

    try {
        const { email, role, rtId, registrationRequestId } = await req.json()

        if (!email || !role) {
            return NextResponse.json({ error: 'email and role are required' }, { status: 400 })
        }

        const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const redirectTo = `${siteUrl}/activation`

        // generateLink: creates/updates the user and returns the link without sending email
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type:    'invite',
            email,
            options: { redirectTo }
        })

        if (error) {
            // User already registered — generate a magic link instead
            const { data: ml, error: mlErr } = await supabaseAdmin.auth.admin.generateLink({
                type:    'magiclink',
                email,
                options: { redirectTo }
            })
            if (mlErr) {
                return NextResponse.json({ error: mlErr.message }, { status: 500 })
            }
            const link = ml.properties?.action_link
            console.log(`\n[DEV INVITE] role=${role} email=${email} (magic-link)\n→ ${link}\n`)
            return NextResponse.json({ link, email, role, type: 'magiclink' })
        }

        const link = data.properties?.action_link

        // Optionally record activation_invites row (mirrors the real /api/invite flow)
        if (registrationRequestId) {
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            await supabaseAdmin.from('activation_invites').insert({
                registration_request_id: registrationRequestId,
                email,
                role,
                rt_id:      rtId || null,
                expires_at: expiresAt
            })
        }

        console.log(`\n[DEV INVITE] role=${role} email=${email}\n→ ${link}\n`)
        return NextResponse.json({ link, email, role, type: 'invite' })

    } catch (err) {
        console.error('[dev/invite-link] error:', err)
        return NextResponse.json({ error: (err as Error).message }, { status: 500 })
    }
}
