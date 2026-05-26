import { supabase }
  from '../supabase'

export async function getHomeSummary(
  tahun
) {

  const { data: pemasukan } =
    await supabase
      .from('detail_pembayaran')
      .select('nominal')
      .eq('tahun', tahun)

  const { data: pengeluaran } =
    await supabase
      .from('pengeluaran')
      .select('nominal, tanggal')

  const totalMasuk =
    (pemasukan || [])
      .reduce(
        (sum, item) =>
          sum + item.nominal,
        0
      )

  const totalKeluar =
    (pengeluaran || [])
      .filter(item =>
        new Date(item.tanggal)
          .getFullYear() === tahun
      )
      .reduce(
        (sum, item) =>
          sum + item.nominal,
        0
      )

  return {
    totalMasuk,
    totalKeluar,
    saldo:
      totalMasuk - totalKeluar
  }
}

export async function getMonthlyCashflow(
  tahun
) {

  const { data, error } =
    await supabase
      .from('detail_pembayaran')
      .select(`
        bulan,
        nominal
      `)
      .eq('tahun', tahun)

  if (error)
    throw error

  return data || []
}