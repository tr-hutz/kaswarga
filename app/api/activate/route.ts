/* eslint-disable @typescript-eslint/no-explicit-any */
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

export async function POST(req: Request) {
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

        const email = user.email ?? ''

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

        // Resolve display name from registration request
        const regReq     = invite.registration_request
        const nameByRole = {
            CHAIR:     regReq?.chair_name,
            ADMIN:     regReq?.admin_name,
            TREASURER: regReq?.treasurer_name,
            RESIDENT:  regReq?.resident_name,
        }
        const displayName = (nameByRole as any)[invite.role] || user.user_metadata?.full_name || (user.email ?? '').split('@')[0]

        // Remove any stale users row from a previously deleted auth account with the same
        // email. Supabase auth enforces unique emails, so if a different ID owns this email
        // it must be from a deleted account and is safe to cascade-delete.
        try {
            await supabaseAdmin
                .from('users')
                .delete()
                .eq('email', user.email ?? '')
                .neq('id', user.id)
        } catch (_) {}

        // Ensure user row exists in public.users with the name from the registration request
        await supabaseAdmin.from('users').upsert({
            id:    user.id,
            email: user.email,
            name:  displayName
        }, { onConflict: 'id' })

        // Check for existing membership (idempotent).
        // Use .is() for null rt_id to avoid .eq(null) being interpreted as IS NULL,
        // which would falsely match super_admin rows that have rt_id = NULL.
        const membershipQuery = supabaseAdmin
            .from('memberships')
            .select('id')
            .eq('user_id', user.id)

        const { data: existing } = await (
            invite.rt_id
                ? membershipQuery.eq('rt_id', invite.rt_id)
                : membershipQuery.is('rt_id', null)
        ).maybeSingle()

        if (existing) {
            return NextResponse.json({ error: 'Already activated', code: 'ALREADY_ACTIVATED' }, { status: 409 })
        }

        // Create resident row for the activated user (only when linked to an RT).
        // Reuse an existing row if this email is already registered in the RT
        // (can happen after re-invites or manual backfills).
        let residentId = null
        if (invite.rt_id) {
            const { data: existingResident } = await supabaseAdmin
                .from('residents')
                .select('id')
                .eq('rt_id', invite.rt_id)
                .eq('email', user.email ?? '')
                .maybeSingle()

            if (existingResident) {
                residentId = existingResident.id
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const residentData: any = {
                    rt_id:  invite.rt_id,
                    name:   displayName,
                    email:  user.email,
                    active: true,
                }
                if (invite.role === 'RESIDENT' && regReq) {
                    residentData.block        = (regReq as any).block        || null
                    residentData.house_number = (regReq as any).house_number || null
                    residentData.phone        = (regReq as any).phone        || null
                }
                const { data: resident, error: residentError } = await supabaseAdmin
                    .from('residents')
                    .insert(residentData)
                    .select('id')
                    .single()
                if (residentError) {
                    console.error('[activate] resident error:', residentError)
                    return NextResponse.json({ error: residentError.message }, { status: 500 })
                }
                residentId = resident.id
            }
        }

        // Create membership
        const { error: memberError } = await supabaseAdmin
            .from('memberships')
            .insert({
                user_id:     user.id,
                rt_id:       (invite.rt_id || null) as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                role:        invite.role as any,
                status:      'active',
                resident_id: residentId
            })

        if (memberError) {
            // Unique constraint violation — membership already exists (race condition or stale check).
            // Clean up the orphan resident row we just created and treat as already activated.
            if (memberError.code === '23505') {
                if (residentId) {
                    try {
                        await supabaseAdmin.from('residents').delete().eq('id', residentId)
                    } catch (_) {}
                }
                return NextResponse.json({ error: 'Already activated', code: 'ALREADY_ACTIVATED' }, { status: 409 })
            }
            console.error('[activate] membership error:', memberError)
            return NextResponse.json({ error: memberError.message }, { status: 500 })
        }

        // Mark invite activated
        await supabaseAdmin
            .from('activation_invites')
            .update({ activated_at: new Date().toISOString() })
            .eq('id', invite.id)

        // Get RT name for response
        let rtName = null
        if (invite.rt_id) {
            const { data: rt } = await supabaseAdmin
                .from('rt')
                .select('name')
                .eq('id', invite.rt_id)
                .single()
            rtName = rt?.name || null
        }

        // Log activity
        await supabaseAdmin.from('activity_logs').insert({
            rt_id:       (invite.rt_id || null) as any,
            actor_id:    user.id,
            actor_name:  user.email ?? '',
            action:      'ACTIVATE_ACCOUNT',
            entity_type: 'memberships',
            entity_id:   user.id,
            description: `${user.email} mengaktifkan akun sebagai ${invite.role}`,
            metadata:    { role: invite.role, rt_id: invite.rt_id }
        });

        return NextResponse.json({
            ok:       true,
            role:     invite.role,
            rtName,
            displayName
        })

    } catch (err) {
        console.error('[activate] unexpected error:', err)
        return NextResponse.json({ error: (err as Error).message }, { status: 500 })
    }
}
