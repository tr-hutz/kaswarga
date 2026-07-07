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
    transformExpense
} from '../../features/pengeluaran/services/pengeluaran-transform'

import {
    applyExpenseFilters
} from '../helpers/filter-pengeluaran'

/*
|------------------------------------------------------------------
| GENERATE NOMOR BUKTI
|------------------------------------------------------------------
*/

export async function generateNomorBukti() {

    const membership = await getCurrentMembership()
    const rtId  = membership?.rt?.id
    const kode  = membership?.rt?.kode || 'RT'

    const now  = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    const startOfMonth    = new Date(year, month - 1, 1).toISOString()
    const startOfNextMonth = new Date(year, month, 1).toISOString()

    const { count } = await supabase
        .from('pengeluaran')
        .select('*', { count: 'exact', head: true })
        .eq('rt_id', rtId)
        .gte('created_at', startOfMonth)
        .lt('created_at', startOfNextMonth)

    const seq   = (count || 0) + 1
    const dd    = String(now.getDate()).padStart(2, '0')
    const mm    = String(month).padStart(2, '0')
    const seqStr = String(seq).padStart(5, '0')

    return `${dd}${mm}${year}-${kode}-${seqStr}`
}

/*
|------------------------------------------------------------------
| GET
|------------------------------------------------------------------
*/

export async function getExpenses({

                                         category,
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
        nomor_bukti,
        kategori,
        deskripsi,
        nominal,
        penerima,
        tanggal,

        nota_url,
        status,
        created_by,
        approved_by,
        approved_at,
        catatan_penolakan,

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
        applyExpenseFilters(

            query,

            {

                rtId,
                category,
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

    return transformExpense(
        data || []
    )
}

/*
|------------------------------------------------------------------
| CREATE
|------------------------------------------------------------------
*/

export async function createExpense(
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

            nomor_bukti:
            payload.receiptNumber || null,

            kategori:
            payload.category,

            deskripsi:
            payload.description,

            nominal:
            payload.amount,

            penerima:
            payload.recipient || null,

            tanggal:
            payload.date,

            nota_url:
            payload.receiptUrl || null,

            created_by:
            membership?.user?.id || null,

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
            category:    data.kategori,
            description: data.deskripsi,
            amount:      data.nominal,
            date:        data.tanggal
        }
    })

    // Notify all ketua in the RT
    try {
        const { data: ketuaList } = await supabase
            .from('user_membership')
            .select('user_id')
            .eq('rt_id', rtId)
            .eq('role', 'ketua')
            .eq('status', 'active')

        if (ketuaList?.length) {
            const notifRows = ketuaList.map(k => ({
                rt_id:          rtId,
                type:           'expense_pending',
                title:          'Pengeluaran Baru',
                message:        `Pengeluaran ${data.nomor_bukti || ''} perlu persetujuan Anda`,
                entity_type:    'pengeluaran',
                entity_id:      data.id,
                target_user_id: k.user_id,
            }))
            await supabase.from('notifications').insert(notifRows)
        }
    } catch {
        // Notification errors must not block the main flow
    }

    return data
}

/*
|------------------------------------------------------------------
| UPDATE
|------------------------------------------------------------------
*/

export async function updateExpense(

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

            nomor_bukti:
            payload.receiptNumber || null,

            kategori:
            payload.category,

            deskripsi:
            payload.description,

            nominal:
            payload.amount,

            penerima:
            payload.recipient || null,

            tanggal:
            payload.date,

            nota_url:
            payload.receiptUrl || null

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
                category:    before?.kategori,
                description: before?.deskripsi,
                amount:      before?.nominal,
                date:        before?.tanggal
            },
            after: {
                category:    data.kategori,
                description: data.deskripsi,
                amount:      data.nominal,
                date:        data.tanggal
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

export async function deleteExpense(
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
            category:    before?.kategori,
            description: before?.deskripsi,
            amount:      before?.nominal,
            date:        before?.tanggal
        }
    })

    return true
}