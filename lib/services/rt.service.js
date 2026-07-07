import { supabase } from '../supabase'
import { getCurrentMembership } from '../auth/getCurrentMembership'
import { logActivity } from './activity-logger'

const SYSTEM_RT_ID = '00000000-0000-0000-0000-000000000001'

/*
|--------------------------------------------------------------------------
| GET ALL RT (super_admin)
|--------------------------------------------------------------------------
*/

export async function getAllRt() {

    const { data, error } = await supabase
        .from('rt')
        .select('id, nama, kode, alamat, kota, provinsi, kode_pos, email, telepon, nominal_iuran, aktif, created_at')
        .neq('id', SYSTEM_RT_ID)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (error) throw error

    return data || []
}

/*
|--------------------------------------------------------------------------
| GET OWN RT (ketua / admin / bendahara)
|--------------------------------------------------------------------------
*/

export async function getOwnRt() {

    const membership = await getCurrentMembership()
    const rtId = membership?.rt?.id

    if (!rtId) throw new Error('RT tidak ditemukan')

    const { data, error } = await supabase
        .from('rt')
        .select('*')
        .eq('id', rtId)
        .single()

    if (error) throw error

    return data
}

/*
|--------------------------------------------------------------------------
| CREATE RT (super_admin)
|--------------------------------------------------------------------------
*/

export async function createRt(payload) {

    const membership = await getCurrentMembership()

    const { data, error } = await supabase
        .from('rt')
        .insert({
            nama:           payload.name,
            kode:           payload.code,
            alamat:         payload.address,
            kota:           payload.city,
            provinsi:       payload.province,
            kode_pos:       payload.postalCode,
            email:          payload.email,
            telepon:        payload.telepon,
            nominal_iuran:  payload.monthlyFee ?? 0,
            nama_bank:      payload.bankName,
            nomor_rekening: payload.accountNumber,
            atas_nama:      payload.accountHolder,
            aktif:          true
        })
        .select()
        .single()

    if (error) throw error

    logActivity({
        rtId:       SYSTEM_RT_ID,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.nama,
        action:     'CREATE_RT',
        entityType: 'rt',
        entityId:   data.id,
        description: `Buat RT baru: ${data.nama}`,
        metadata:   { name: data.nama, code: data.kode }
    })

    return data
}

/*
|--------------------------------------------------------------------------
| UPDATE RT
| super_admin: any RT | ketua/admin/bendahara: own RT only
|--------------------------------------------------------------------------
*/

export async function updateRt(id, payload) {

    const membership = await getCurrentMembership()

    const { data: before } = await supabase
        .from('rt')
        .select('nama, kode, nominal_iuran, nama_bank, nomor_rekening')
        .eq('id', id)
        .single()

    const { data, error } = await supabase
        .from('rt')
        .update({
            nama:           payload.name,
            kode:           payload.code,
            alamat:         payload.address,
            kota:           payload.city,
            provinsi:       payload.province,
            kode_pos:       payload.postalCode,
            email:          payload.email,
            telepon:        payload.telepon,
            nominal_iuran:  payload.monthlyFee,
            nama_bank:      payload.bankName,
            nomor_rekening: payload.accountNumber,
            atas_nama:      payload.accountHolder,
            qris_url:       payload.qrisUrl,
            logo_url:       payload.logoUrl,
            updated_at:     new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error

    logActivity({
        rtId:       membership?.rt?.id ?? SYSTEM_RT_ID,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.nama,
        action:     'UPDATE_RT',
        entityType: 'rt',
        entityId:   id,
        description: `Update RT: ${data.nama}`,
        metadata:   {
            before: { name: before?.nama, code: before?.kode, monthlyFee: before?.nominal_iuran },
            after:  { name: data.nama,   code: data.kode,   monthlyFee: data.nominal_iuran }
        }
    })

    return data
}

/*
|--------------------------------------------------------------------------
| DELETE RT (super_admin only)
| Soft-deletes the RT and deactivates all its members via API route.
|--------------------------------------------------------------------------
*/

export async function deleteRt(id) {
    const res = await fetch(`/api/rt/${id}`, { method: 'DELETE' })
    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal menghapus RT.')
    }
    return true
}
