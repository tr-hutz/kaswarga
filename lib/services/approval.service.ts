import { supabase } from '@/lib/supabase'
import { logActivity } from '@/lib/services/activity-logger'

async function sendInvite({
    registrationRequestId,
    email,
    role,
    rtId
}: {
    registrationRequestId: string
    email: string
    role: string
    rtId: string
}): Promise<string | null> {
    const res = await fetch('/api/invite', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ registrationRequestId, email, role, rtId })
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to send invite')
    }
    const body = await res.json()
    return body.devLink || null
}

/*
|--------------------------------------------------------------------------
| APPROVE RT REGISTRATION
| Creates the RT, updates the request, sends invites to 3 users
|--------------------------------------------------------------------------
*/

interface Actor {
    user?: { id?: string; name?: string; email?: string } | null
    email?: string
}

export async function approveRtRegistration(requestId: string, actor: Actor | null) {
    // Fetch the request
    const { data: req, error: fetchError } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('id', requestId)
        .single()

    if (fetchError || !req) throw new Error('Permintaan tidak ditemukan')
    if (req.status !== 'pending') throw new Error('Permintaan sudah diproses')

    const rtData = (req.rt_data || {}) as Record<string, unknown>

    const rtPayload = {
        name:           rtData.name           as string,
        code:           rtData.code           as string,
        address:        (rtData.address       as string) || null,
        city:           (rtData.city          as string) || null,
        province:       (rtData.province      as string) || null,
        postal_code:    (rtData.postalCode    as string) || null,
        email:          (rtData.email         as string) || null,
        phone:          (rtData.telepon       as string) || null,
        monthly_fee:    (rtData.monthlyFee    as number) || 0,
        bank_name:      (rtData.bankName      as string) || null,
        account_number: (rtData.accountNumber as string) || null,
        account_holder: (rtData.accountHolder as string) || null,
        qris_url:       (rtData.qrisUrl       as string) || null,
        active:         true
    }

    // If an RT with this code already exists, update it; otherwise insert a new one
    const { data: existing } = await supabase
        .from('rt')
        .select('id')
        .eq('code', rtData.code as string)
        .maybeSingle()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rt: any, rtError: any
    if (existing) {
        ;({ data: rt, error: rtError } = await supabase
            .from('rt')
            .update({ ...rtPayload, updated_at: new Date().toISOString() })
            .eq('id', existing.id)
            .select()
            .single())
    } else {
        ;({ data: rt, error: rtError } = await supabase
            .from('rt')
            .insert(rtPayload)
            .select()
            .single())
    }

    if (rtError) throw rtError

    // Mark request approved
    await supabase
        .from('registration_requests')
        .update({
            status:      'approved',
            rt_id:       rt.id,
            approved_by: actor?.user?.id || null,
            approved_at: new Date().toISOString()
        })
        .eq('id', requestId)

    // Send invites — chair required, admin required, treasurer optional
    const invites = [
        { email: req.chair_email,     role: 'CHAIR' },
        { email: req.admin_email,     role: 'ADMIN' },
        { email: req.treasurer_email, role: 'TREASURER' }
    ].filter(i => !!i.email)

    const devLinks = await Promise.all(invites.map(async i => {
        const link = await sendInvite({
            registrationRequestId: requestId,
            email: i.email as string,
            role:  i.role,
            rtId:  rt.id
        })
        return link ? { email: i.email, role: i.role, link } : null
    }))
    const inviteLinks = devLinks.filter(Boolean)

    logActivity({
        rtId:        null,
        actorId:     actor?.user?.id,
        actorName:   actor?.user?.name || actor?.email,
        action:      'APPROVE_RT_REGISTRATION',
        entityType:  'registration_requests',
        entityId:    requestId,
        description: `Pendaftaran RT "${rtData.name}" disetujui`,
        metadata:    { rt_id: rt.id, rt_code: rtData.code }
    })

    return { rt, inviteLinks }
}


/*
|--------------------------------------------------------------------------
| REJECT RT REGISTRATION
|--------------------------------------------------------------------------
*/

export async function rejectRtRegistration(requestId: string, reason: string | null, actor: Actor | null) {
    const { error } = await supabase
        .from('registration_requests')
        .update({
            status:           'rejected',
            rejected_by:      actor?.user?.id || null,
            rejected_at:      new Date().toISOString(),
            rejection_reason: reason || null
        })
        .eq('id', requestId)

    if (error) throw error

    logActivity({
        rtId:        null,
        actorId:     actor?.user?.id,
        actorName:   actor?.user?.name || actor?.email,
        action:      'REJECT_RT_REGISTRATION',
        entityType:  'registration_requests',
        entityId:    requestId,
        description: `Pendaftaran RT ditolak`,
        metadata:    { reason }
    })
}

/*
|--------------------------------------------------------------------------
| APPROVE RESIDENT REGISTRATION
| First-approver-wins: checks status before processing
|--------------------------------------------------------------------------
*/

export async function approveResidentRegistration(requestId: string, actor: Actor | null) {
    // Re-fetch to enforce first-approver-wins
    const { data: req, error: fetchError } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('id', requestId)
        .single()

    if (fetchError || !req) throw new Error('Permintaan tidak ditemukan')
    if (req.status !== 'pending') throw new Error('Permintaan sudah diproses oleh orang lain')

    // Mark approved
    await supabase
        .from('registration_requests')
        .update({
            status:      'approved',
            approved_by: actor?.user?.id || null,
            approved_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('status', 'pending') // extra guard

    // Send invite to resident
    const devLink = await sendInvite({
        registrationRequestId: requestId,
        email: req.resident_email ?? '',
        role:  'RESIDENT',
        rtId:  req.rt_id ?? ''
    })

    logActivity({
        rtId:        req.rt_id,
        actorId:     actor?.user?.id,
        actorName:   actor?.user?.name,
        action:      'APPROVE_RESIDENT_REGISTRATION',
        entityType:  'registration_requests',
        entityId:    requestId,
        description: `Pendaftaran warga "${req.resident_name}" disetujui`,
        metadata:    { email: req.resident_email }
    })

    return { inviteLink: devLink }
}

/*
|--------------------------------------------------------------------------
| REJECT RESIDENT REGISTRATION (hard delete)
|--------------------------------------------------------------------------
*/

export async function rejectResidentRegistration(requestId: string, actor: Actor | null) {
    const { data: req } = await supabase
        .from('registration_requests')
        .select('resident_name, rt_id')
        .eq('id', requestId)
        .single()

    const { error } = await supabase
        .from('registration_requests')
        .delete()
        .eq('id', requestId)

    if (error) throw error

    logActivity({
        rtId:        req?.rt_id || null,
        actorId:     actor?.user?.id,
        actorName:   actor?.user?.name,
        action:      'REJECT_RESIDENT_REGISTRATION',
        entityType:  'registration_requests',
        entityId:    requestId,
        description: `Pendaftaran warga "${req?.resident_name}" ditolak dan dihapus`,
        metadata:    {}
    })
}

/*
|--------------------------------------------------------------------------
| RESEND INVITE
|--------------------------------------------------------------------------
*/

export async function resendInvite(email: string): Promise<void> {
    const res = await fetch('/api/resend-invite', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email })
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Gagal mengirim ulang undangan')
    }
}
