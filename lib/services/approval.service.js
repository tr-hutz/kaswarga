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

    // Create the RT
    const { data: rt, error: rtError } = await supabase
        .from('rt')
        .insert({
            nama:          rtData.nama,
            kode:          rtData.kode,
            alamat:        rtData.alamat        || null,
            kota:          rtData.kota          || null,
            provinsi:      rtData.provinsi      || null,
            kode_pos:      rtData.kodePos       || null,
            email:         rtData.email         || null,
            telepon:       rtData.telepon       || null,
            nominal_iuran: rtData.nominalIuran  || 0,
            nama_bank:     rtData.namaBank      || null,
            nomor_rekening: rtData.nomorRekening || null,
            atas_nama:     rtData.atasNama      || null,
            qris_url:      rtData.qrisUrl       || null,
            aktif:         true
        })
        .select()
        .single()

    if (rtError) throw rtError

    // Mark request approved
    await supabase
        .from('registration_requests')
        .update({
            status:      'approved',
            rt_id:       rt.id,
            approved_by: actor?.id || null,
            approved_at: new Date().toISOString()
        })
        .eq('id', requestId)

    // Send invites — ketua required, admin required, bendahara optional
    const invites = [
        { email: req.email,           role: 'ketua' },
        { email: req.email_admin,     role: 'admin' },
        { email: req.email_bendahara, role: 'bendahara' }
    ].filter(i => !!i.email)

    await Promise.all(invites.map(i => sendInvite({
        registrationRequestId: requestId,
        email: i.email,
        role:  i.role,
        rtId:  rt.id
    })))

    logActivity({
        rtId:        null,
        actorId:     actor?.id,
        actorName:   actor?.user?.nama || actor?.email,
        action:      'APPROVE_RT_REGISTRATION',
        entityType:  'registration_requests',
        entityId:    requestId,
        description: `Pendaftaran RT "${rtData.nama}" disetujui`,
        metadata:    { rt_id: rt.id, rt_kode: rtData.kode }
    })

    return rt
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
            rejected_by:      actor?.id || null,
            rejected_at:      new Date().toISOString(),
            rejection_reason: reason || null
        })
        .eq('id', requestId)

    if (error) throw error

    logActivity({
        rtId:        null,
        actorId:     actor?.id,
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

export async function approveWargaRegistration(requestId, actor) {
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
            approved_by: actor?.id || null,
            approved_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('status', 'pending') // extra guard

    // Send invite to warga
    await sendInvite({
        registrationRequestId: requestId,
        email: req.email,
        role:  'warga',
        rtId:  req.rt_id
    })

    logActivity({
        rtId:        req.rt_id,
        actorId:     actor?.id,
        actorName:   actor?.user?.nama,
        action:      'APPROVE_WARGA_REGISTRATION',
        entityType:  'registration_requests',
        entityId:    requestId,
        description: `Pendaftaran warga "${req.nama}" disetujui`,
        metadata:    { email: req.email }
    })
}

/*
|--------------------------------------------------------------------------
| REJECT WARGA REGISTRATION (hard delete)
|--------------------------------------------------------------------------
*/

export async function rejectWargaRegistration(requestId, actor) {
    const { data: req } = await supabase
        .from('registration_requests')
        .select('nama, rt_id')
        .eq('id', requestId)
        .single()

    const { error } = await supabase
        .from('registration_requests')
        .delete()
        .eq('id', requestId)

    if (error) throw error

    logActivity({
        rtId:        req?.rt_id || null,
        actorId:     actor?.id,
        actorName:   actor?.user?.nama,
        action:      'REJECT_WARGA_REGISTRATION',
        entityType:  'registration_requests',
        entityId:    requestId,
        description: `Pendaftaran warga "${req?.nama}" ditolak dan dihapus`,
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
