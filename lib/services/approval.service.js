import { supabase } from '@/lib/supabase'
import { logActivity } from '@/lib/services/activity-logger'

async function sendInvite({ registrationRequestId, email, role, rtId }) {
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

export async function approveRtRegistration(requestId, actor) {
    // Fetch the request
    const { data: req, error: fetchError } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('id', requestId)
        .single()

    if (fetchError || !req) throw new Error('Permintaan tidak ditemukan')
    if (req.status !== 'pending') throw new Error('Permintaan sudah diproses')

    const rtData = req.rt_data || {}

    const rtPayload = {
        nama:           rtData.name,
        kode:           rtData.code,
        alamat:         rtData.address       || null,
        kota:           rtData.city          || null,
        provinsi:       rtData.province      || null,
        kode_pos:       rtData.postalCode    || null,
        email:          rtData.email         || null,
        telepon:        rtData.telepon       || null,
        nominal_iuran:  rtData.monthlyFee    || 0,
        nama_bank:      rtData.bankName      || null,
        nomor_rekening: rtData.accountNumber || null,
        atas_nama:      rtData.accountHolder || null,
        qris_url:       rtData.qrisUrl       || null,
        aktif:          true
    }

    // If an RT with this kode already exists, update it; otherwise insert a new one
    const { data: existing } = await supabase
        .from('rt')
        .select('id')
        .eq('kode', rtData.code)
        .maybeSingle()

    let rt, rtError
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

    // Send invites — ketua required, admin required, bendahara optional
    const invites = [
        { email: req.email_ketua,     role: 'ketua' },
        { email: req.email_admin,     role: 'admin' },
        { email: req.email_bendahara, role: 'bendahara' }
    ].filter(i => !!i.email)

    const devLinks = await Promise.all(invites.map(async i => {
        const link = await sendInvite({
            registrationRequestId: requestId,
            email: i.email,
            role:  i.role,
            rtId:  rt.id
        })
        return link ? { email: i.email, role: i.role, link } : null
    }))
    const inviteLinks = devLinks.filter(Boolean)

    logActivity({
        rtId:        null,
        actorId:     actor?.user?.id,
        actorName:   actor?.user?.nama || actor?.email,
        action:      'APPROVE_RT_REGISTRATION',
        entityType:  'registration_requests',
        entityId:    requestId,
        description: `Pendaftaran RT "${rtData.name}" disetujui`,
        metadata:    { rt_id: rt.id, rt_kode: rtData.code }
    })

    return { rt, inviteLinks }
}


/*
|--------------------------------------------------------------------------
| REJECT RT REGISTRATION
|--------------------------------------------------------------------------
*/

export async function rejectRtRegistration(requestId, reason, actor) {
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
        actorName:   actor?.user?.nama || actor?.email,
        action:      'REJECT_RT_REGISTRATION',
        entityType:  'registration_requests',
        entityId:    requestId,
        description: `Pendaftaran RT ditolak`,
        metadata:    { reason }
    })
}

/*
|--------------------------------------------------------------------------
| APPROVE WARGA REGISTRATION
| First-approver-wins: checks status before processing
|--------------------------------------------------------------------------
*/

export async function approveResidentRegistration(requestId, actor) {
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

    // Send invite to warga
    const devLink = await sendInvite({
        registrationRequestId: requestId,
        email: req.email_warga,
        role:  'warga',
        rtId:  req.rt_id
    })

    logActivity({
        rtId:        req.rt_id,
        actorId:     actor?.user?.id,
        actorName:   actor?.user?.nama,
        action:      'APPROVE_WARGA_REGISTRATION',
        entityType:  'registration_requests',
        entityId:    requestId,
        description: `Pendaftaran warga "${req.nama_warga}" disetujui`,
        metadata:    { email: req.email_warga }
    })

    return { inviteLink: devLink }
}

/*
|--------------------------------------------------------------------------
| REJECT WARGA REGISTRATION (hard delete)
|--------------------------------------------------------------------------
*/

export async function rejectResidentRegistration(requestId, actor) {
    const { data: req } = await supabase
        .from('registration_requests')
        .select('nama_warga, rt_id')
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
        actorName:   actor?.user?.nama,
        action:      'REJECT_WARGA_REGISTRATION',
        entityType:  'registration_requests',
        entityId:    requestId,
        description: `Pendaftaran warga "${req?.nama_warga}" ditolak dan dihapus`,
        metadata:    {}
    })
}

/*
|--------------------------------------------------------------------------
| RESEND INVITE
|--------------------------------------------------------------------------
*/

export async function resendInvite(email) {
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
