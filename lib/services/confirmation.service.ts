import { supabase }
  from '../supabase'

export async function getPendingPayments(
  wargaId: string,
  year: number
) {

  const { data, error } =
    await supabase
      .from(
        'detail_konfirmasi_pembayaran'
      )
      .select(`
        id,
        bulan,
        nominal,
        konfirmasi_pembayaran!inner(
          status,
          created_at
        )
      `)
      .eq('warga_id', wargaId)
      .eq('tahun', year)
      .eq(
        'konfirmasi_pembayaran.status',
        'pending'
      )
      .order('bulan')

  if (error)
    throw error

  return (data || []).map(item => ({
    ...item,
    month: item.bulan,
    amount: item.nominal
  }))
}

export async function getRejectedPayments(
  wargaId: string,
  year: number
) {

  const { data, error } =
    await supabase
      .from(
        'detail_konfirmasi_pembayaran'
      )
      .select(`
        id,
        bulan,
        nominal,
        konfirmasi_pembayaran!inner(
          status,
          alasan_penolakan
        )
      `)
      .eq('warga_id', wargaId)
      .eq('tahun', year)
      .eq(
        'konfirmasi_pembayaran.status',
        'rejected'
      )
      .order('bulan')

  if (error)
    throw error

  return (data || []).map(item => ({
    ...item,
    month: item.bulan,
    amount: item.nominal
  }))
}

export async function approveConfirmation(
  konfirmasiId: string
): Promise<void> {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('approve_konfirmasi', { p_konfirmasi_id: konfirmasiId })

  if (error)
    throw error
}

export async function rejectConfirmation(
  konfirmasiId: string,
  reason: string
): Promise<void> {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('reject_konfirmasi', { p_konfirmasi_id: konfirmasiId, p_alasan: reason })

  if (error)
    throw error
}
