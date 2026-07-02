import { supabase }
  from '../supabase'

import { getCurrentMembership }
  from '../auth/getCurrentMembership'

export async function getReportPembayaran(
  tahun
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
      .eq('tahun', tahun)
      .eq('pembayaran.rt_id', rtId)
      .order('bulan')

  if (error)
    throw error

  return data || []
}

export async function getReportPengeluaran(
  tahun
) {

  const membership = await getCurrentMembership()
  const rtId = membership?.rt?.id

  if (!rtId) return []

  const { data, error } =
    await supabase
      .from('pengeluaran')
      .select('*')
      .eq('rt_id', rtId)
      .gte('tanggal', `${tahun}-01-01`)
      .lt('tanggal', `${tahun + 1}-01-01`)
      .order('tanggal')

  if (error)
    throw error

  return data || []
}