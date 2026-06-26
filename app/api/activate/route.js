import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/*
|--------------------------------------------------------------------------
| POST /api/activate
|
| Header: Authorization: Bearer <access_token>
|
| Verifies the token, finds a pending activation invite for that email,
| creates the user_membership row, marks the invite activated,
| and logs the activity.
|--------------------------------------------------------------------------
*/

export async function POST(req) {
    try {
        const authHeader = req.headers.get('authorization') || ''
        const token = authHeader.replace('Bearer ', '').trim()

        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 })
        }

        // Verify token and get user
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

        if (userError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const email = user.email

        // Find the most recent non-activated invite for this email
        const { data: invite, error: inviteError } = await supabaseAdmin
            .from('activation_invites')
            .select('*, registration_request:registration_requests(*)')
            .eq('email', email)
            .is('activated_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (inviteError || !invite) {
            return NextResponse.json({ error: 'No pending invite found', code: 'NOT_FOUND' }, { status: 404 })
        }

        // Check expiry
        if (new Date(invite.expires_at) < new Date()) {
            return NextResponse.json({
                error:     'Invite expired',
                code:      'EXPIRED',
                inviteId:  invite.id,
                email:     invite.email
            }, { status: 410 })
        }

        // Ensure user row exists in public.users
        await supabaseAdmin.from('users').upsert({
            id:    user.id,
            email: user.email,
            nama:  user.user_metadata?.full_name || user.email.split('@')[0]
        }, { onConflict: 'id' })

        // Check for existing membership (idempotent)
        const { data: existing } = await supabaseAdmin
            .from('user_membership')
            .select('id')
            .eq('user_id', user.id)
            .eq('rt_id', invite.rt_id)
            .maybeSingle()

        if (existing) {
            return NextResponse.json({ error: 'Already activated', code: 'ALREADY_ACTIVATED' }, { status: 409 })
        }

        // Create membership
        const { error: memberError } = await supabaseAdmin
            .from('user_membership')
            .insert({
                user_id: user.id,
                rt_id:   invite.rt_id || null,
                role:    invite.role
            })

        if (memberError) {
            console.error('[activate] membership error:', memberError)
            return NextResponse.json({ error: memberError.message }, { status: 500 })
        }

        // Mark invite activated
        await supabaseAdmin
            .from('activation_invites')
            .update({ activated_at: new Date().toISOString() })
            .eq('id', invite.id)

        // Get RT name for response
        let rtNama = null
        if (invite.rt_id) {
            const { data: rt } = await supabaseAdmin
                .from('rt')
                .select('nama')
                .eq('id', invite.rt_id)
                .single()
            rtNama = rt?.nama || null
        }

        // Log activity
        await supabaseAdmin.from('activity_logs').insert({
            rt_id:       invite.rt_id || null,
            actor_id:    user.id,
            actor_name:  user.email,
            action:      'ACTIVATE_ACCOUNT',
            entity_type: 'user_membership',
            entity_id:   user.id,
            description: `${user.email} mengaktifkan akun sebagai ${invite.role}`,
            metadata:    { role: invite.role, rt_id: invite.rt_id }
        }).catch(err => console.error('[activate] log error:', err))

        return NextResponse.json({
            ok:     true,
            role:   invite.role,
            rtNama
        })

    } catch (err) {
        console.error('[activate] unexpected error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
