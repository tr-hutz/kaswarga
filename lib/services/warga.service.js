import {
    supabase
} from '../supabase'

import {
    getCurrentMembership
} from '../auth/getCurrentMembership'

import {
    logActivity
} from './activity-logger'

import {
    applyWargaFilters
} from '../helpers/filter-warga'

import {

    transformWarga

} from '../../features/warga/services/warga-transform'

/*
 |-------------------------------------------------------------
 | GET WARGA
 |-------------------------------------------------------------
 */

export async function getWarga({

                                   search,

                                   status

                               } = {}) {

    /*
     |---------------------------------------------------------
     | MEMBERSHIP
     |---------------------------------------------------------
     */

    const membership =
        await getCurrentMembership()

    const rtId =
        membership?.rt?.id

    /*
     |---------------------------------------------------------
     | QUERY
     |---------------------------------------------------------
     */

    let query =
        supabase

            .from('warga')

            .select(`

                id,
                nama,
                blok,
                no_rumah,
                no_hp,
                rt_id,
                aktif,
                created_at,
                
                pembayaran:pembayaran (
                  id,
                  tahun,
                
                  detail_pembayaran (
                    id,
                    bulan,
                    nominal
                  )
                )

            `)

            .order(
                'nama',
                {
                    ascending: true
                }
            )

    /*
     |---------------------------------------------------------
     | FILTER
     |---------------------------------------------------------
     */

    query =
        applyWargaFilters(
            query,
            {
                rtId,
                search,
                status
            }
        )

    /*
     |---------------------------------------------------------
     | EXECUTE
     |---------------------------------------------------------
     */

    const {
        data,
        error
    } = await query

    if (error) {
        throw error
    }

    /*
     |---------------------------------------------------------
     | TRANSFORM
     |---------------------------------------------------------
     */

    return transformWarga(
        data || []
    )
}

export async function getWargaPaymentHistory(
    wargaId,
    tahun
) {

    let query =
        supabase
            .from('pembayaran')
            .select(`
        id,
        tanggal,
        tahun,
        warga_id,

        detail_pembayaran (
          id,
          bulan,
          nominal
        )
      `)
            .eq('warga_id', wargaId)
            .order('tanggal', {
                ascending: false
            })

    if (tahun) {
        query = query.eq(
            'tahun',
            tahun
        )
    }

    const {
        data,
        error
    } = await query

    if (error) {
        throw error
    }

    return data || []
}

export async function createWarga(
    payload
) {

    /*
   |-------------------------------------------------------------
   | MEMBERSHIP
   |-------------------------------------------------------------
   */

    const membership =
        await getCurrentMembership()

    const rtId =
        membership?.rt?.id

    if (!rtId) {

        throw new Error(
            'RT tidak ditemukan'
        )
    }

    const {
        data,
        error
    } = await supabase

        .from('warga')

        .insert({

            nama:
            payload.nama,

            blok:
            payload.blok,

            no_rumah:
            payload.noRumah,

            no_hp:
            payload.noHp,

            rt_id:
            rtId,

            aktif: true

        })

        .select()
        .single()

    if (error) {
        throw error
    }

    logActivity({
        rtId:       membership?.rt?.id,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.nama,
        action:     'CREATE_WARGA',
        entityType: 'warga',
        entityId:   data.id,
        description: `Tambah warga baru: ${data.nama}`,
        metadata:   {
            nama:     data.nama,
            blok:     data.blok,
            no_rumah: data.no_rumah,
            no_hp:    data.no_hp
        }
    })

    return data
}

export async function updateWarga(
    id,
    payload
) {

    const membership =
        await getCurrentMembership()

    const { data: before } =
        await supabase
            .from('warga')
            .select('nama, blok, no_rumah, no_hp')
            .eq('id', id)
            .single()

    const {
        data,
        error
    } = await supabase

        .from('warga')

        .update({

            nama:
            payload.nama,

            blok:
            payload.blok,

            no_rumah:
            payload.noRumah,

            no_hp:
            payload.noHp

        })

        .eq(
            'id',
            id
        )

        .select()
        .single()

    if (error) {
        throw error
    }

    logActivity({
        rtId:       membership?.rt?.id,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.nama,
        action:     'UPDATE_WARGA',
        entityType: 'warga',
        entityId:   id,
        description: `Update warga: ${data.nama}`,
        metadata:   {
            before: {
                nama:     before?.nama,
                blok:     before?.blok,
                no_rumah: before?.no_rumah,
                no_hp:    before?.no_hp
            },
            after: {
                nama:     data.nama,
                blok:     data.blok,
                no_rumah: data.no_rumah,
                no_hp:    data.no_hp
            }
        }
    })

    return data
}


export async function deleteWarga(
    id
) {

    const membership =
        await getCurrentMembership()

    const { data: before } =
        await supabase
            .from('warga')
            .select('nama, blok, no_rumah')
            .eq('id', id)
            .single()

    const {
        error
    } = await supabase

        .from('warga')

        .update({

            aktif: false

        })

        .eq(
            'id',
            id
        )

    if (error) {
        throw error
    }

    logActivity({
        rtId:       membership?.rt?.id,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.nama,
        action:     'DEACTIVATE_WARGA',
        entityType: 'warga',
        entityId:   id,
        description: `Nonaktifkan warga: ${before?.nama}`,
        metadata:   {
            nama:     before?.nama,
            blok:     before?.blok,
            no_rumah: before?.no_rumah
        }
    })

    return true
}