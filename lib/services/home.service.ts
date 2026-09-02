import { supabase }
  from '@/lib/supabase'

import { getCurrentMembership }
  from '@/lib/auth/getCurrentMembership'

export async function getHomeSummary(
  year: number
) {

  const membership = await getCurrentMembership()
  const rtId = membership?.rt?.id

  if (!rtId) return { totalIncome: 0, totalExpense: 0, balance: 0 }

  const { data: paymentRows } =
    await supabase
      .from('payments')
      .select('payment_details(amount)')
      .eq('rt_id', rtId)
      .eq('year', year)

  const totalIncome =
    (paymentRows || [])
      .flatMap(p => p.payment_details || [])
      .reduce((sum, item) => sum + (item.amount || 0), 0)

  const { data: expenseRows } =
    await supabase
      .from('expenses')
      .select('amount')
      .eq('rt_id', rtId)
      .gte('date', `${year}-01-01`)
      .lt('date', `${year + 1}-01-01`)

  const totalExpense =
    (expenseRows || [])
      .reduce((sum, item) => sum + (item.amount || 0), 0)

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense
  }
}

export async function getMonthlyCashflow(
  year: number
) {

  const membership = await getCurrentMembership()
  const rtId = membership?.rt?.id

  if (!rtId) return []

  const { data, error } =
    await supabase
      .from('payments')
      .select('payment_details(month, amount)')
      .eq('rt_id', rtId)
      .eq('year', year)

  if (error) throw error

  return (data || []).flatMap(p => p.payment_details || [])
}
