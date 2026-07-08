import { supabase } from '../supabase'
import type { Database } from '../../types/database'

type RtRow = Database['public']['Tables']['rt']['Row']
type RtInsert = Database['public']['Tables']['rt']['Insert']
type RtUpdate = Database['public']['Tables']['rt']['Update']

export async function findAllRt(excludeId: string) {
    const { data, error } = await supabase
        .from('rt')
        .select('id, name, code, address, city, province, postal_code, email, phone, monthly_fee, active, created_at')
        .neq('id', excludeId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
}

export async function findRtById(id: string): Promise<RtRow> {
    const { data, error } = await supabase
        .from('rt')
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw error
    return data
}

export async function findRtSnapshot(id: string) {
    const { data } = await supabase
        .from('rt')
        .select('name, code, monthly_fee, bank_name, account_number')
        .eq('id', id)
        .single()
    return data
}

export async function findRtByCode(code: string) {
    const { data, error } = await supabase
        .from('rt')
        .select('id')
        .eq('code', code)
        .maybeSingle()

    if (error) throw error
    return data
}

export async function insertRt(payload: RtInsert): Promise<RtRow> {
    const { data, error } = await supabase
        .from('rt')
        .insert(payload)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function updateRtById(id: string, payload: RtUpdate): Promise<RtRow> {
    const { data, error } = await supabase
        .from('rt')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}
