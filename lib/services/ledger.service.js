import {

    supabase

} from '../supabase'

import {

    transformLedger

} from '../../features/ledger/services/ledger-transform'

export async function getLedger({

                                    search = ''

                                } = {}) {

    let query =
        supabase

            .from('ledger')

            .select('*')

            .eq(
                'aktif',
                true
            )

            .order(
                'tanggal',
                {
                    ascending: false
                }
            )

    if (search) {

        query =
            query.ilike(
                'deskripsi',
                `%${search}%`
            )
    }

    const {

        data,
        error

    } = await query

    if (error) {
        throw error
    }

    return transformLedger(
        data || []
    )
}