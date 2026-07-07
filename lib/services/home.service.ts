import { supabase }
  from '../supabase'

import { getCurrentMembership }
  from '../auth/getCurrentMembership'

export async function getHomeSummary(
  year: number
) {

  const membership = await getCurrentMembership()
  const rtId = membership?.rt?.id

  if (!rtId) return { totalIncome: 0, totalExpense: 0, balance: 0 }

  const { data: paymentRows } =
    await supabase
      .from('pembayaran')
      .select('detail_pembayaran!detail_pembayaran_pembayaran_id_fkey(nominal)')
      .eq('rt_id', rtId)
      .eq('tahun', year)

  const totalIncome =
    (paymentRows || [])
      .flatMap(p => p.detail_pembayaran || [])
      .reduce((sum, item) => sum + (item.nominal || 0), 0)

  const { data: expenseRows } =
    await supabase
      .from('pengeluaran')
      .select('nominal')
      .eq('rt_id', rtId)
      .gte('tanggal', `${year}-01-01`)
      .lt('tanggal', `${year + 1}-01-01`)

  const totalExpense =
    (expenseRows || [])
      .reduce((sum, item) => sum + (item.nominal || 0), 0)

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
      .from('pembayaran')
      .select('detail_pembayaran!detail_pembayaran_pembayaran_id_fkey(bulan, nominal)')
      .eq('rt_id', rtId)
      .eq('tahun', year)

  if (error) throw error

  return (data || []).flatMap(p => p.detail_pembayaran || [])
}