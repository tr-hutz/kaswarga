import { supabase }
  from '../supabase'

import { getCurrentMembership }
  from '../auth/getCurrentMembership'

export async function getHomeSummary(
  tahun
) {

  const membership = await getCurrentMembership()
  const rtId = membership?.rt?.id

  if (!rtId) return { totalMasuk: 0, totalKeluar: 0, saldo: 0 }

  const { data: pembayaranRows } =
    await supabase
      .from('pembayaran')
      .select('detail_pembayaran!detail_pembayaran_pembayaran_id_fkey(nominal)')
      .eq('rt_id', rtId)
      .eq('tahun', tahun)

  const totalMasuk =
    (pembayaranRows || [])
      .flatMap(p => p.detail_pembayaran || [])
      .reduce((sum, item) => sum + (item.nominal || 0), 0)

  const { data: pengeluaran } =
    await supabase
      .from('pengeluaran')
      .select('nominal')
      .eq('rt_id', rtId)
      .gte('tanggal', `${tahun}-01-01`)
      .lt('tanggal', `${tahun + 1}-01-01`)

  const totalKeluar =
    (pengeluaran || [])
      .reduce((sum, item) => sum + (item.nominal || 0), 0)

  return {
    totalMasuk,
    totalKeluar,
    saldo: totalMasuk - totalKeluar
  }
}

export async function getMonthlyCashflow(
  tahun
) {

  const membership = await getCurrentMembership()
  const rtId = membership?.rt?.id

  if (!rtId) return []

  const { data, error } =
    await supabase
      .from('pembayaran')
      .select('detail_pembayaran!detail_pembayaran_pembayaran_id_fkey(bulan, nominal)')
      .eq('rt_id', rtId)
      .eq('tahun', tahun)

  if (error) throw error

  return (data || []).flatMap(p => p.detail_pembayaran || [])
}