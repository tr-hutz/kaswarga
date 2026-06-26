import { supabase } from '@/lib/supabase'

/*
|--------------------------------------------------------------------------
| Generate unique RT code via DB function
|--------------------------------------------------------------------------
*/

export async function generateRtCode() {
    const { data, error } = await supabase.rpc('generate_rt_code')
    if (error) throw error
    return data
}

/*
|--------------------------------------------------------------------------
| Submit RT Registration
|--------------------------------------------------------------------------
*/

export async function submitRtRegistration({
    nama,
    email,
    emailKetua,
    emailAdmin,
    emailBendahara,
    rtData
}) {
    const { data, error } = await supabase
        .from('registration_requests')
        .insert({
            type:            'rt',
            nama,
            email:           emailKetua,
            email_admin:     emailAdmin     || null,
            email_bendahara: emailBendahara || null,
            rt_kode:         rtData.kode,
            rt_data:         rtData,
            expires_at:      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single()

    if (error) throw error
    return data
}

/*
|--------------------------------------------------------------------------
| Submit Warga Registration
|--------------------------------------------------------------------------
*/

export async function submitWargaRegistration({
    nama,
    email,
    rtKode,
    blok,
    noRumah,
    noHp
}) {
    // Validate RT code exists
    const { data: rt, error: rtError } = await supabase
        .from('rt')
        .select('id, nama')
        .eq('kode', rtKode.trim().toUpperCase())
        .maybeSingle()

    if (rtError) throw rtError
    if (!rt) throw new Error(`RT dengan kode "${rtKode}" tidak ditemukan.`)

    const { data, error } = await supabase
        .from('registration_requests')
        .insert({
            type:      'warga',
            nama,
            email,
            rt_kode:   rtKode.trim().toUpperCase(),
            rt_id:     rt.id,
            blok:      blok || null,
            no_rumah:  noRumah || null,
            no_hp:     noHp || null,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single()

    if (error) throw error
    return { ...data, rtNama: rt.nama }
}
