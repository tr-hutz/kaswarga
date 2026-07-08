import { supabase } from '../supabase'
import type { Database, Json } from '../../types/database'

type RegistrationRequestInsert = Database['public']['Tables']['registration_requests']['Insert']
type RegistrationRequestUpdate = Database['public']['Tables']['registration_requests']['Update']
type RtInsert = Database['public']['Tables']['rt']['Insert']
type RtUpdate = Database['public']['Tables']['rt']['Update']

export async function generateRtCode(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_rt_code')
    if (error) throw error
    return data
}

export async function findRegistrationRequestById(id: string) {
    const { data, error } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw error
    return data
}

export async function findRtByCode(code: string) {
    const { data, error } = await supabase
        .from('rt')
        .select('id, name')
        .eq('code', code)
        .maybeSingle()

    if (error) throw error
    return data
}

export async function findExistingRtByCode(code: string) {
    const { data } = await supabase
        .from('rt')
        .select('id')
        .eq('code', code)
        .maybeSingle()
    return data
}

export async function insertRt(payload: RtInsert) {
    const { data, error } = await supabase
        .from('rt')
        .insert(payload)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function updateRtById(id: string, payload: RtUpdate) {
    const { data, error } = await supabase
        .from('rt')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function insertRegistrationRequest(payload: RegistrationRequestInsert) {
    const { data, error } = await supabase
        .from('registration_requests')
        .insert(payload)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function updateRegistrationRequestById(id: string, payload: RegistrationRequestUpdate) {
    const { error } = await supabase
        .from('registration_requests')
        .update(payload)
        .eq('id', id)

    if (error) throw error
}

export async function updateRegistrationRequestApprovedById(id: string, payload: RegistrationRequestUpdate) {
    const { error } = await supabase
        .from('registration_requests')
        .update(payload)
        .eq('id', id)
        .eq('status', 'pending')

    if (error) throw error
}

export async function deleteRegistrationRequestById(id: string) {
    const { error } = await supabase
        .from('registration_requests')
        .delete()
        .eq('id', id)

    if (error) throw error
}

export async function findRegistrationRequestSnapshot(id: string) {
    const { data } = await supabase
        .from('registration_requests')
        .select('resident_name, rt_id')
        .eq('id', id)
        .single()
    return data
}
