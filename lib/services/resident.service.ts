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

} from '../../features/resident/services/resident-transform'

/*
 |-------------------------------------------------------------
 | GET RESIDENTS
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

            .from('residents')

            .select(`

                id,
                name,
                block,
                house_number,
                phone,
                rt_id,
                active,
                created_at,

                payments:payments (
                  id,
                  year,

                  payment_details (
                    id,
                    month,
                    amount
                  )
                )

            `)

            .order(
                'name',
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
    residentId: string,
    year?: number | null
) {

    let query =
        supabase
            .from('payments')
            .select(`
        id,
        date,
        year,
        resident_id,

        payment_details (
          id,
          month,
          amount
        )
      `)
            .eq('resident_id', residentId)
            .order('date', {
                ascending: false
            })

    if (year) {
        query = query.eq(
            'year',
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

        .from('residents')

        .insert({

            name:
            payload.name,

            block:
            payload.block,

            house_number:
            payload.houseNumber,

            phone:
            payload.phone,

            rt_id:
            rtId,

            active: true

        })

        .select()
        .single()

    if (error) {
        throw error
    }

    logActivity({
        rtId:       membership?.rt?.id,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.name,
        action:     'CREATE_RESIDENT',
        entityType: 'residents',
        entityId:   data.id,
        description: `Tambah warga baru: ${data.name}`,
        metadata:   {
            name:        data.name,
            block:       data.block,
            houseNumber: data.house_number,
            phone:       data.phone
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
            .from('residents')
            .select('name, block, house_number, phone')
            .eq('id', id)
            .single()

    const {
        data,
        error
    } = await supabase

        .from('residents')

        .update({

            name:
            payload.name,

            block:
            payload.block,

            house_number:
            payload.houseNumber,

            phone:
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
        actorName:  membership?.user?.name,
        action:     'UPDATE_RESIDENT',
        entityType: 'residents',
        entityId:   id,
        description: `Update warga: ${data.name}`,
        metadata:   {
            before: {
                name:        before?.name,
                block:       before?.block,
                houseNumber: before?.house_number,
                phone:       before?.phone
            },
            after: {
                name:        data.name,
                block:       data.block,
                houseNumber: data.house_number,
                phone:       data.phone
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
            .from('residents')
            .select('name, block, house_number')
            .eq('id', id)
            .single()

    const {
        error
    } = await supabase

        .from('residents')

        .update({

            active: false

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
        actorName:  membership?.user?.name,
        action:     'DEACTIVATE_RESIDENT',
        entityType: 'residents',
        entityId:   id,
        description: `Nonaktifkan warga: ${before?.name}`,
        metadata:   {
            name:        before?.name,
            block:       before?.block,
            houseNumber: before?.house_number
        }
    })

    return true
}
