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
        .select('id, nama, kode, alamat, kota, nominal_iuran, aktif, created_at')
        .neq('id', SYSTEM_RT_ID)
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
            nama:           payload.nama,
            kode:           payload.kode,
            alamat:         payload.alamat,
            kota:           payload.kota,
            provinsi:       payload.provinsi,
            kode_pos:       payload.kodePos,
            email:          payload.email,
            telepon:        payload.telepon,
            nominal_iuran:  payload.nominalIuran ?? 0,
            nama_bank:      payload.namaBank,
            nomor_rekening: payload.nomorRekening,
            atas_nama:      payload.atasNama,
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
        metadata:   { nama: data.nama, kode: data.kode }
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
            nama:           payload.nama,
            kode:           payload.kode,
            alamat:         payload.alamat,
            kota:           payload.kota,
            provinsi:       payload.provinsi,
            kode_pos:       payload.kodePos,
            email:          payload.email,
            telepon:        payload.telepon,
            nominal_iuran:  payload.nominalIuran,
            nama_bank:      payload.namaBank,
            nomor_rekening: payload.nomorRekening,
            atas_nama:      payload.atasNama,
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
            before: { nama: before?.nama, kode: before?.kode, nominal_iuran: before?.nominal_iuran },
            after:  { nama: data.nama,   kode: data.kode,   nominal_iuran: data.nominal_iuran }
        }
    })

    return data
}

/*
|--------------------------------------------------------------------------
| DELETE RT (super_admin only — system RT is protected by DB trigger)
|--------------------------------------------------------------------------
*/

export async function deleteRt(id) {

    const membership = await getCurrentMembership()

    const { data: before } = await supabase
        .from('rt')
        .select('nama, kode')
        .eq('id', id)
        .single()

    const { error } = await supabase
        .from('rt')
        .delete()
        .eq('id', id)

    if (error) throw error

    logActivity({
        rtId:       SYSTEM_RT_ID,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.nama,
        action:     'DELETE_RT',
        entityType: 'rt',
        entityId:   id,
        description: `Hapus RT: ${before?.nama}`,
        metadata:   { nama: before?.nama, kode: before?.kode }
    })

    return true
}
