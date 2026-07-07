import { supabase } from '@/lib/supabase'
import type { Json } from '@/types'

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

interface RtRegistrationPayload {
    chairmanEmail?: string
    chairmanName?: string
    adminEmail?: string
    adminName?: string
    treasurerEmail?: string
    treasurerName?: string
    rtData: Record<string, unknown>
}

export async function submitRtRegistration({
    chairmanEmail,
    chairmanName,
    adminEmail,
    adminName,
    treasurerEmail,
    treasurerName,
    rtData
}: RtRegistrationPayload) {
    const { data, error } = await supabase
        .from('registration_requests')
        .insert({
            type:             'rt',
            nama_ketua:       chairmanName   || null,
            email_ketua:      chairmanEmail  || null,
            nama_admin:       adminName      || null,
            email_admin:      adminEmail     || null,
            email_bendahara:  treasurerEmail || null,
            nama_bendahara:   treasurerName  || null,
            rt_kode:          rtData.code as string,
            rt_data:          rtData as unknown as Json,
            expires_at:       new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
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

interface WargaRegistrationPayload {
    name: string
    email: string
    rtCode: string
    block?: string | null
    houseNumber?: string | null
    phone?: string | null
}

export async function submitWargaRegistration({
    name,
    email,
    rtCode,
    block,
    houseNumber,
    phone
}: WargaRegistrationPayload) {
    // Validate RT code exists
    const { data: rt, error: rtError } = await supabase
        .from('rt')
        .select('id, nama')
        .eq('kode', rtCode.trim().toUpperCase())
        .maybeSingle()

    if (rtError) throw rtError
    if (!rt) throw new Error(`RT dengan kode "${rtCode}" tidak ditemukan.`)

    const { data, error } = await supabase
        .from('registration_requests')
        .insert({
            type:        'warga',
            nama_warga:  name,
            email_warga: email,
            rt_kode:     rtCode.trim().toUpperCase(),
            rt_id:     rt.id,
            blok:      block || null,
            no_rumah:  houseNumber || null,
            no_hp:     phone || null,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single()

    if (error) throw error
    return { ...data, rtName: rt.nama }
}
