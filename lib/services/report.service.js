import { supabase }
  from '../supabase'

import { getCurrentMembership }
  from '../auth/getCurrentMembership'

export async function getPaymentReport(
  year
) {

  const membership = await getCurrentMembership()
  const rtId = membership?.rt?.id

  if (!rtId) return []

  const { data, error } =
    await supabase
      .from('detail_pembayaran')
      .select(`
        bulan,
        nominal,
        pembayaran!inner(tanggal, rt_id),
        warga(nama, blok, no_rumah)
      `)
      .eq('tahun', year)
      .eq('pembayaran.rt_id', rtId)
      .order('bulan')

  if (error)
    throw error

  return data || []
}

export async function getExpenseReport(
  year
) {

  const membership = await getCurrentMembership()
  const rtId = membership?.rt?.id

  if (!rtId) return []

  const { data, error } =
    await supabase
      .from('pengeluaran')
      .select('*')
      .eq('rt_id', rtId)
      .gte('tanggal', `${year}-01-01`)
      .lt('tanggal', `${year + 1}-01-01`)
      .order('tanggal')

  if (error)
    throw error

  return data || []
}