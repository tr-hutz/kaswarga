import { supabase }
  from '../supabase'

export async function getPendingPayments(
  residentId: string,
  year: number
) {

  const { data, error } =
    await supabase
      .from(
        'confirmation_details'
      )
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
      .eq(
        'payment_confirmations.status',
        'pending'
      )
      .order('month')

  if (error)
    throw error

  return (data || []).map(item => ({
    ...item,
    month: item.month,
    amount: item.amount
  }))
}

export async function getRejectedPayments(
  residentId: string,
  year: number
) {

  const { data, error } =
    await supabase
      .from(
        'confirmation_details'
      )
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
      .eq(
        'payment_confirmations.status',
        'rejected'
      )
      .order('month')

  if (error)
    throw error

  return (data || []).map(item => ({
    ...item,
    month: item.month,
    amount: item.amount
  }))
}

export async function approveConfirmation(
  confirmationId: string
): Promise<void> {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('approve_konfirmasi', { p_confirmation_id: confirmationId })

  if (error)
    throw error
}

export async function rejectConfirmation(
  confirmationId: string,
  reason: string
): Promise<void> {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('reject_konfirmasi', { p_confirmation_id: confirmationId, p_reason: reason })

  if (error)
    throw error
}
