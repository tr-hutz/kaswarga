import {

    supabase

} from '../supabase'

import {

    getCurrentMembership

} from '../auth/getCurrentMembership'

import {

    transformLedger

} from '../../features/ledger/services/ledger-transform'

export async function getLedger({

                                    search = ''

                                } = {}) {

    const membership =
        await getCurrentMembership()

    const rtId =
        membership?.rt?.id

    if (!rtId) {
        return []
    }

    let query =
        supabase

            .from('ledger')

            .select('*')

            .eq(
                'rt_id',
                rtId
            )

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