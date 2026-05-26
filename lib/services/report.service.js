import { supabase }
  from '../supabase'

export async function getReportPembayaran(
  tahun
) {

  const { data, error } =
    await supabase
      .from('detail_pembayaran')
      .select(`
        bulan,
        nominal,
        pembayaran (
          tanggal
        ),
        warga (
          nama,
          blok,
          nomor_rumah
        )
      `)
      .eq('tahun', tahun)
      .order('bulan')

  if (error)
    throw error

  return data || []
}

export async function getReportPengeluaran(
  tahun
) {

  const { data, error } =
    await supabase
      .from('pengeluaran')
      .select('*')
      .order('tanggal')

  if (error)
    throw error

  return (
    data || []
  ).filter(
    item =>
      new Date(item.tanggal)
        .getFullYear() === tahun
  )
}