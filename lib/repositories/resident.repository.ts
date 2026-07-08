import { supabase } from '../supabase'
import type { Database } from '../../types/database'
import { applyResidentFilters } from '../helpers/filter-warga'

type ResidentInsert = Database['public']['Tables']['residents']['Insert']
type ResidentUpdate = Database['public']['Tables']['residents']['Update']

export async function findResidents(options: {
    rtId?: string | null
    search?: string | null
    status?: string | null
}) {
    let query = supabase
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
        .is('deleted_at', null)
        .order('name', { ascending: true })

    query = applyResidentFilters(query, options)

    const { data, error } = await query
    if (error) throw error
    return data ?? []
}

export async function findResidentSnapshot(id: string) {
    const { data } = await supabase
        .from('residents')
        .select('name, block, house_number, phone')
        .eq('id', id)
        .single()
    return data
}

export async function findResidentPaymentHistory(
    residentId: string,
    year?: number | null
) {
    let query = supabase
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
        .order('date', { ascending: false })

    if (year) {
        query = query.eq('year', year)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
}

export async function insertResident(payload: ResidentInsert) {
    const { data, error } = await supabase
        .from('residents')
        .insert(payload)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function updateResidentById(id: string, payload: ResidentUpdate) {
    const { data, error } = await supabase
        .from('residents')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}
