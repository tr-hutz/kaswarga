import { supabase } from '@/lib/supabase'

export async function findPendingConfirmationDetails(residentId: string, year: number) {
    const { data, error } = await supabase
        .from('confirmation_details')
        .select(`
            id,
            month,
            amount,
            payment_confirmations!inner(
                status,
                created_at
            )
        `)
        .eq('resident_id', residentId)
        .eq('year', year)
        .eq('payment_confirmations.status', 'pending')
        .order('month')

    if (error) throw error
    return (data ?? []).map(item => ({
        ...item,
        month: item.month,
        amount: item.amount
    }))
}

export async function findRejectedConfirmationDetails(residentId: string, year: number) {
    const { data, error } = await supabase
        .from('confirmation_details')
        .select(`
            id,
            month,
            amount,
            payment_confirmations!inner(
                status,
                rejection_reason
            )
        `)
        .eq('resident_id', residentId)
        .eq('year', year)
        .eq('payment_confirmations.status', 'rejected')
        .order('month')

    if (error) throw error
    return (data ?? []).map(item => ({
        ...item,
        month: item.month,
        amount: item.amount
    }))
}

export async function callApproveConfirmation(confirmationId: string, userId?: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('approve_confirmation', {
        p_confirmation_id: confirmationId,
        ...(userId ? { p_user_id: userId } : {})
    })

    if (error) throw error
}

export async function callRejectConfirmation(confirmationId: string, reason: string, userId?: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('reject_confirmation', {
        p_confirmation_id: confirmationId,
        p_reason:          reason,
        ...(userId ? { p_user_id: userId } : {})
    })

    if (error) throw error
}
