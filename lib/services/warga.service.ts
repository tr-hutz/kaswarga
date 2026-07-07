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
    applyResidentFilters
} from '../helpers/filter-warga'

import {

    transformResident

} from '../../features/warga/services/warga-transform'

/*
 |-------------------------------------------------------------
 | GET WARGA
 |-------------------------------------------------------------
 */

export async function getResidents({
    search,
    status
}: {
    search?: string | null
    status?: string | null
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
        applyResidentFilters(
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

    return transformResident(
        data || []
    )
}

export async function getResidentPaymentHistory(
    wargaId: string,
    year?: number | null
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

    if (year) {
        query = query.eq(
            'tahun',
            year
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

interface ResidentPayload {
    name: string
    block?: string | null
    houseNumber?: string | null
    phone?: string | null
}

export async function createResident(
    payload: ResidentPayload
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
            payload.name,

            blok:
            payload.block,

            no_rumah:
            payload.houseNumber,

            no_hp:
            payload.phone,

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
            name:        data.nama,
            block:       data.blok,
            houseNumber: data.no_rumah,
            phone:       data.no_hp
        }
    })

    return data
}

export async function updateResident(
    id: string,
    payload: ResidentPayload
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
            payload.name,

            blok:
            payload.block,

            no_rumah:
            payload.houseNumber,

            no_hp:
            payload.phone

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
                name:        before?.nama,
                block:       before?.blok,
                houseNumber: before?.no_rumah,
                phone:       before?.no_hp
            },
            after: {
                name:        data.nama,
                block:       data.blok,
                houseNumber: data.no_rumah,
                phone:       data.no_hp
            }
        }
    })

    return data
}


export async function deleteResident(
    id: string
): Promise<true> {

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
            name:        before?.nama,
            block:       before?.blok,
            houseNumber: before?.no_rumah
        }
    })

    return true
}