import { supabase }
  from '../supabase'

import { getCurrentMembership }
  from '../auth/getCurrentMembership'

export async function getPaymentReport(
  year: number
) {

  const membership = await getCurrentMembership()
  const rtId = membership?.rt?.id

  if (!rtId) return []

  const { data, error } =
    await supabase
      .from('payment_details')
      .select(`
        month,
        amount,
        payments!inner(date, rt_id),
        residents(name, block, house_number)
      `)
      .eq('year', year)
      .eq('payments.rt_id', rtId)
      .order('month')

  if (error)
    throw error

  return data || []
}

export async function getExpenseReport(
  year: number
) {

  const membership = await getCurrentMembership()
  const rtId = membership?.rt?.id

  if (!rtId) return []

  const { data, error } =
    await supabase
      .from('expenses')
      .select('*')
      .eq('rt_id', rtId)
      .gte('date', `${year}-01-01`)
      .lt('date', `${year + 1}-01-01`)
      .order('date')

  if (error)
    throw error

  return data || []
}
