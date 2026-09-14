import { getCurrentMembership } from '@/lib/auth/getCurrentMembership'
import { logActivity } from './activity-logger'
import {
    findAllRt,
    findRtById,
    findRtSnapshot,
    insertRt,
    updateRtById
} from '@/lib/repositories/rt.repository'

const SYSTEM_RT_ID = '00000000-0000-0000-0000-000000000001'

/*
|--------------------------------------------------------------------------
| GET ALL RT (super_admin)
|--------------------------------------------------------------------------
*/

export async function getAllRt() {
    return findAllRt(SYSTEM_RT_ID)
}

/*
|--------------------------------------------------------------------------
| GET OWN RT (chair / admin / treasurer)
|--------------------------------------------------------------------------
*/

export async function getOwnRt() {

    const membership = await getCurrentMembership()
    const rtId = membership?.rt?.id

    if (!rtId) throw new Error('RT tidak ditemukan')

    return findRtById(rtId)
}

/*
|--------------------------------------------------------------------------
| CREATE RT (super_admin)
|--------------------------------------------------------------------------
*/

interface RtPayload {
    name: string
    code: string
    address?: string | null
    city?: string | null
    province?: string | null
    postalCode?: string | null
    email?: string | null
    phone?: string | null
    monthlyFee?: number
    bankName?: string | null
    accountNumber?: string | null
    accountHolder?: string | null
    qrisUrl?: string | null
    logoUrl?: string | null
}

export async function createRt(payload: RtPayload) {

    const membership = await getCurrentMembership()

    const data = await insertRt({
        name:           payload.name,
        code:           payload.code,
        address:        payload.address,
        city:           payload.city,
        province:       payload.province,
        postal_code:    payload.postalCode,
        email:          payload.email,
        phone:          payload.phone,
        monthly_fee:    payload.monthlyFee ?? 0,
        bank_name:      payload.bankName,
        account_number: payload.accountNumber,
        account_holder: payload.accountHolder,
        active:         true
    })

    logActivity({
        rtId:       SYSTEM_RT_ID,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.name,
        action:     'CREATE_RT',
        entityType: 'rt',
        entityId:   data.id,
        description: `Buat RT baru: ${data.name}`,
        metadata:   { name: data.name, code: data.code }
    })

    return data
}

/*
|--------------------------------------------------------------------------
| UPDATE RT
| super_admin: any RT | chair/admin/treasurer: own RT only
|--------------------------------------------------------------------------
*/

export async function updateRt(id: string, payload: RtPayload) {

    const membership = await getCurrentMembership()

    const before = await findRtSnapshot(id)

    const data = await updateRtById(id, {
        name:           payload.name,
        code:           payload.code,
        address:        payload.address,
        city:           payload.city,
        province:       payload.province,
        postal_code:    payload.postalCode,
        email:          payload.email,
        phone:          payload.phone,
        monthly_fee:    payload.monthlyFee,
        bank_name:      payload.bankName,
        account_number: payload.accountNumber,
        account_holder: payload.accountHolder,
        qris_url:       payload.qrisUrl,
        logo_url:       payload.logoUrl,
        updated_at:     new Date().toISOString()
    })

    logActivity({
        rtId:       membership?.rt?.id ?? SYSTEM_RT_ID,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.name,
        action:     'UPDATE_RT',
        entityType: 'rt',
        entityId:   id,
        description: `Update RT: ${data.name}`,
        metadata:   {
            before: { name: before?.name, code: before?.code, monthlyFee: before?.monthly_fee },
            after:  { name: data.name,   code: data.code,   monthlyFee: data.monthly_fee }
        }
    })

    return data
}

/*
|--------------------------------------------------------------------------
| DELETE RT (super_admin only)
| Soft-deletes the RT and deactivates all its members via API route.
|--------------------------------------------------------------------------
*/

export async function deleteRt(id: string): Promise<true> {
    const res = await fetch(`/api/rt/${id}`, { method: 'DELETE' })
    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to delete RT.')
    }
    return true
}
