import { supabase } from '../supabase'
import { applyPaymentFilters } from '../helpers/filter-payment'
import { applyConfirmationFilters } from '../helpers/filter-confirmation'

export async function findApprovedPaymentDetails(options: {
    rtId?: string | null
    residentId?: string | null
    year: number
}) {
    let query = supabase
        .from('payment_details')
        .select(`
            id,
            month,
            amount,
            payments!inner (
                id,
                date,
                year,
                resident_id,
                rt_id
            )
        `)
        .eq('payments.year', options.year)
        .order('month', { ascending: true })

    if (options.rtId) {
        query = query.eq('payments.rt_id', options.rtId)
    }

    if (options.residentId) {
        query = query.eq('payments.resident_id', options.residentId)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(item => ({
        ...item,
        month: item.month,
        amount: item.amount
    }))
}

export async function findPendingConfirmationDetailsForHome(options: {
    rtId?: string | null
    residentId?: string | null
    year: number
}) {
    let query = supabase
        .from('confirmation_details')
        .select(`
            id,
            month,
            amount,
            payment_confirmations!inner (
                id,
                status,
                year,
                resident_id,
                rt_id
            )
        `)
        .eq('payment_confirmations.year', options.year)
        .eq('payment_confirmations.status', 'pending')
        .order('month', { ascending: true })

    if (options.rtId) {
        query = query.eq('payment_confirmations.rt_id', options.rtId)
    }

    if (options.residentId) {
        query = query.eq('payment_confirmations.resident_id', options.residentId)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
}

export async function findRejectedConfirmationDetailsForHome(options: {
    rtId?: string | null
    residentId?: string | null
    year: number
}) {
    let query = supabase
        .from('confirmation_details')
        .select(`
            id,
            month,
            amount,
            payment_confirmations!inner (
                id,
                status,
                year,
                resident_id,
                rt_id
            )
        `)
        .eq('payment_confirmations.year', options.year)
        .eq('payment_confirmations.status', 'rejected')
        .order('month', { ascending: true })

    if (options.rtId) {
        query = query.eq('payment_confirmations.rt_id', options.rtId)
    }

    if (options.residentId) {
        query = query.eq('payment_confirmations.resident_id', options.residentId)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
}

export async function findPaymentsForDashboard(options: {
    year: number
    rtId?: string | null
    wargaId?: string | null
}) {
    let query = supabase
        .from('payments')
        .select(`
            id,
            date,
            year,
            rt_id,
            resident_id,
            payment_details:payment_details (
                id,
                month,
                amount
            )
        `)

    query = applyPaymentFilters(query, options)

    const { data, error } = await query
    if (error) throw error
    return data ?? []
}

export async function findExpensesForDashboard(options: {
    rtId?: string | null
    year: number
}) {
    let query = supabase
        .from('expenses')
        .select(`id, amount, date, category, rt_id`)
        .gte('date', `${options.year}-01-01`)
        .lte('date', `${options.year}-12-31`)

    if (options.rtId) {
        query = query.eq('rt_id', options.rtId)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
}

export async function findResidentIdsByRt(rtId?: string | null) {
    let query = supabase
        .from('residents')
        .select('id')

    if (rtId) {
        query = query.eq('rt_id', rtId)
    }

    const { data } = await query
    return data ?? []
}

export async function findPaymentsForHealth(options: {
    year: number
    rtId?: string | null
    wargaId?: string | null
}) {
    let query = supabase
        .from('payments')
        .select(`
            id,
            resident_id,
            payment_details (
                id,
                month
            )
        `)

    query = applyPaymentFilters(query, options)

    const { data, error } = await query
    if (error) throw error
    return data ?? []
}

export async function findPayments(options: {
    year: number
    rtId?: string | null
    wargaId?: string | null
}) {
    let query = supabase
        .from('payments')
        .select(`
            id,
            year,
            date,
            rt_id,
            resident_id,
            residents:residents!payments_resident_id_fkey (
                id,
                name,
                block,
                house_number
            ),
            payment_details:payment_details (
                id,
                month,
                amount
            )
        `)
        .order('date', { ascending: false })

    query = applyPaymentFilters(query, options)

    const { data, error } = await query
    if (error) throw error
    return data ?? []
}

export async function findConfirmations(options: {
    year: number
    status: string
    rtId?: string | null
    wargaId?: string | null
}) {
    let query = supabase
        .from('payment_confirmations')
        .select(`
            id,
            year,
            status,
            total_amount,
            proof_url,
            created_at,
            rt_id,
            resident_id,
            residents:residents (
                id,
                name,
                block,
                house_number
            ),
            confirmation_details:confirmation_details (
                id,
                month,
                amount
            )
        `)
        .order('created_at', { ascending: false })

    query = applyConfirmationFilters(query, options)

    const { data, error } = await query
    if (error) throw error
    return data ?? []
}

export async function findPaymentConfirmations(options: {
    year?: number | null
    status?: string | null
    search?: string | null
    rtId?: string | null
    residentId?: string | null
}) {
    let query = supabase
        .from('payment_confirmations')
        .select(`
            id,
            year,
            status,
            total_amount,
            proof_url,
            created_at,
            rt_id,
            resident_id,
            residents:residents!inner (
                id,
                name,
                block,
                house_number
            ),
            confirmation_details:confirmation_details (
                id,
                month,
                amount
            )
        `)
        .order('created_at', { ascending: false })

    if (options.year) {
        query = query.eq('year', options.year)
    }

    if (options.status && options.status !== 'all') {
        query = query.eq('status', options.status)
    }

    if (options.rtId) {
        query = query.eq('rt_id', options.rtId)
    }

    if (options.residentId) {
        query = query.eq('resident_id', options.residentId)
    }

    if (options.search) {
        query = query.ilike('residents.name', `%${options.search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
}

export async function findConfirmationById(id: string) {
    const { data } = await supabase
        .from('payment_confirmations')
        .select('resident_id, year, total_amount, confirmation_details(month)')
        .eq('id', id)
        .single()
    return data
}

export async function callApproveKonfirmasi(confirmationId: string, userId: string) {
    const { data, error } = await supabase.rpc('approve_konfirmasi', {
        p_confirmation_id: confirmationId,
        p_user_id:         userId
    })

    if (error) throw error
    return data
}

export async function callRejectKonfirmasi(confirmationId: string, reason: string, userId: string) {
    const { data, error } = await supabase.rpc('reject_konfirmasi', {
        p_confirmation_id: confirmationId,
        p_reason:          reason,
        p_user_id:         userId
    })

    if (error) throw error
    return data
}
