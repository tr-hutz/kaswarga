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
    transformPengeluaran
} from '../../features/pengeluaran/services/pengeluaran-transform'

import {
    applyPengeluaranFilters
} from '../helpers/filter-pengeluaran'

/*
|------------------------------------------------------------------
| GET
|------------------------------------------------------------------
*/

export async function getPengeluaran({

                                         kategori,
                                         search

                                     } = {}) {

    /*
     |-------------------------------------------------------------
     | MEMBERSHIP
     |-------------------------------------------------------------
     */

    const membership =
        await getCurrentMembership()

    const rtId =
        membership?.rt?.id

    /*
     |-------------------------------------------------------------
     | QUERY
     |-------------------------------------------------------------
     */

    let query =
        supabase

            .from('pengeluaran')

            .select(`

        id,
        kategori,
        deskripsi,
        nominal,
        tanggal,

        nota_url,

        rt_id

      `)

            .order(
                'tanggal',
                {
                    ascending: false
                }
            )

    /*
     |-------------------------------------------------------------
     | FILTERS
     |-------------------------------------------------------------
     */

    query =
        applyPengeluaranFilters(

            query,

            {

                rtId,
                kategori,
                search

            }

        )

    /*
     |-------------------------------------------------------------
     | EXECUTE
     |-------------------------------------------------------------
     */

    const {
        data,
        error
    } = await query

    if (error) {
        throw error
    }

    return transformPengeluaran(
        data || []
    )
}

/*
|------------------------------------------------------------------
| CREATE
|------------------------------------------------------------------
*/

export async function createPengeluaran(
    payload
) {

    const membership =
        await getCurrentMembership()

    const rtId =
        membership?.rt?.id

    const {

        data,
        error

    } = await supabase

        .from('pengeluaran')

        .insert({

            kategori:
            payload.kategori,

            deskripsi:
            payload.deskripsi,

            nominal:
            payload.nominal,

            tanggal:
            payload.tanggal,

            nota_url:
            payload.buktiUrl,

            rt_id:
            rtId

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
        action:     'CREATE_PENGELUARAN',
        entityType: 'pengeluaran',
        entityId:   data.id,
        description: `Tambah pengeluaran: ${data.deskripsi}`,
        metadata:   {
            kategori: data.kategori,
            deskripsi: data.deskripsi,
            nominal:  data.nominal,
            tanggal:  data.tanggal
        }
    })

    return data
}

/*
|------------------------------------------------------------------
| UPDATE
|------------------------------------------------------------------
*/

export async function updatePengeluaran(

    id,
    payload

) {

    const membership =
        await getCurrentMembership()

    const { data: before } =
        await supabase
            .from('pengeluaran')
            .select('kategori, deskripsi, nominal, tanggal')
            .eq('id', id)
            .single()

    const {

        data,
        error

    } = await supabase

        .from('pengeluaran')

        .update({

            kategori:
            payload.kategori,

            deskripsi:
            payload.deskripsi,

            nominal:
            payload.nominal,

            tanggal:
            payload.tanggal,

            nota_url:
            payload.buktiUrl

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
        action:     'UPDATE_PENGELUARAN',
        entityType: 'pengeluaran',
        entityId:   id,
        description: `Update pengeluaran: ${data.deskripsi}`,
        metadata:   {
            before: {
                kategori:  before?.kategori,
                deskripsi: before?.deskripsi,
                nominal:   before?.nominal,
                tanggal:   before?.tanggal
            },
            after: {
                kategori:  data.kategori,
                deskripsi: data.deskripsi,
                nominal:   data.nominal,
                tanggal:   data.tanggal
            }
        }
    })

    return data
}

/*
|------------------------------------------------------------------
| DELETE
|------------------------------------------------------------------
*/

export async function deletePengeluaran(
    id
) {

    const membership =
        await getCurrentMembership()

    const { data: before } =
        await supabase
            .from('pengeluaran')
            .select('kategori, deskripsi, nominal, tanggal')
            .eq('id', id)
            .single()

    const {

        error

    } = await supabase

        .from('pengeluaran')

        .delete()

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
        action:     'DELETE_PENGELUARAN',
        entityType: 'pengeluaran',
        entityId:   id,
        description: `Hapus pengeluaran: ${before?.deskripsi}`,
        metadata:   {
            kategori:  before?.kategori,
            deskripsi: before?.deskripsi,
            nominal:   before?.nominal,
            tanggal:   before?.tanggal
        }
    })

    return true
}