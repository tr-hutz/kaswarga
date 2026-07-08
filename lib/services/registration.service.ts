import type { Json } from '@/types'
import {
    generateRtCode as generateRtCodeFromRepo,
    findRtByCode,
    insertRegistrationRequest
} from '@/lib/repositories/registration.repository'

/*
|--------------------------------------------------------------------------
| Generate unique RT code via DB function
|--------------------------------------------------------------------------
*/

export async function generateRtCode() {
    return generateRtCodeFromRepo()
}

/*
|--------------------------------------------------------------------------
| Submit RT Registration
|--------------------------------------------------------------------------
*/

interface RtRegistrationPayload {
    chairmanEmail?: string
    chairmanName?: string
    adminEmail?: string
    adminName?: string
    treasurerEmail?: string
    treasurerName?: string
    rtData: Record<string, unknown>
}

export async function submitRtRegistration({
    chairmanEmail,
    chairmanName,
    adminEmail,
    adminName,
    treasurerEmail,
    treasurerName,
    rtData
}: RtRegistrationPayload) {
    return insertRegistrationRequest({
        type:            'rt',
        chair_name:      chairmanName   || null,
        chair_email:     chairmanEmail  || null,
        admin_name:      adminName      || null,
        admin_email:     adminEmail     || null,
        treasurer_email: treasurerEmail || null,
        treasurer_name:  treasurerName  || null,
        rt_code:         rtData.code as string,
        rt_data:         rtData as unknown as Json,
        expires_at:      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
}

/*
|--------------------------------------------------------------------------
| Submit Warga Registration
|--------------------------------------------------------------------------
*/

interface WargaRegistrationPayload {
    name: string
    email: string
    rtCode: string
    block?: string | null
    houseNumber?: string | null
    phone?: string | null
}

export async function submitWargaRegistration({
    name,
    email,
    rtCode,
    block,
    houseNumber,
    phone
}: WargaRegistrationPayload) {
    // Validate RT code exists
    const rt = await findRtByCode(rtCode.trim().toUpperCase())

    if (!rt) throw new Error(`RT dengan kode "${rtCode}" tidak ditemukan.`)

    const data = await insertRegistrationRequest({
        type:           'resident',
        resident_name:  name,
        resident_email: email,
        rt_code:        rtCode.trim().toUpperCase(),
        rt_id:          rt.id,
        block:          block || null,
        house_number:   houseNumber || null,
        phone:          phone || null,
        expires_at:     new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })

    return { ...data, rtName: rt.name }
}
