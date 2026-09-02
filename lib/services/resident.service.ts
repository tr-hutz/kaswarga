import { getCurrentMembership } from '@/lib/auth/getCurrentMembership'
import { logActivity } from './activity-logger'
import { transformResident } from '@/features/resident/services/resident-transform'
import {
    findResidents,
    findResidentSnapshot,
    findResidentPaymentHistory,
    insertResident,
    updateResidentById
} from '@/lib/repositories/resident.repository'

function handleResidentDbError(error: unknown): never {
    const e = error as { code?: string; message?: string }
    if (e?.code === '23505') {
        const msg = (e.message ?? '').toLowerCase()
        if (msg.includes('phone_per_rt')) throw new Error('DUPLICATE_PHONE')
        throw new Error('DUPLICATE_NAME')
    }
    throw error
}

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

    const membership = await getCurrentMembership()
    const rtId = membership?.rt?.id

    const data = await findResidents({ rtId, search, status })

    return transformResident(data)
}

export async function getResidentPaymentHistory(
    residentId: string,
    year?: number | null
) {
    return findResidentPaymentHistory(residentId, year)
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

    const membership = await getCurrentMembership()
    const rtId = membership?.rt?.id

    if (!rtId) {
        throw new Error('RT tidak ditemukan')
    }

    const data = await insertResident({
        name:         payload.name,
        block:        payload.block,
        house_number: payload.houseNumber,
        phone:        payload.phone,
        rt_id:        rtId,
        active:       true
    }).catch(handleResidentDbError)

    logActivity({
        rtId:       membership?.rt?.id,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.name,
        action:     'CREATE_RESIDENT',
        entityType: 'residents',
        entityId:   data.id,
        description: `Create resident: ${data.name}`,
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

    const membership = await getCurrentMembership()

    const before = await findResidentSnapshot(id)

    const data = await updateResidentById(id, {
        name:         payload.name,
        block:        payload.block,
        house_number: payload.houseNumber,
        phone:        payload.phone,
        updated_at:   new Date().toISOString(),
        updated_by:   membership?.user?.id ?? null
    }).catch(handleResidentDbError)

    logActivity({
        rtId:       membership?.rt?.id,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.name,
        action:     'UPDATE_RESIDENT',
        entityType: 'residents',
        entityId:   id,
        description: `Update resident: ${data.name}`,
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

    const membership = await getCurrentMembership()

    const before = await findResidentSnapshot(id)

    await updateResidentById(id, {
        active:     false,
        deleted_at: new Date().toISOString(),
        deleted_by: membership?.user?.id ?? null
    })

    logActivity({
        rtId:       membership?.rt?.id,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.name,
        action:     'DEACTIVATE_RESIDENT',
        entityType: 'residents',
        entityId:   id,
        description: `Deactivate resident: ${before?.name}`,
        metadata:   {
            name:        before?.name,
            block:       before?.block,
            houseNumber: before?.house_number
        }
    })

    return true
}
