import {
    supabase
} from '../supabase'

import {
    getCurrentMembership
} from '../auth/getCurrentMembership'

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

    return true
}