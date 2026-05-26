import { supabase }
  from '../supabase'

export async function getPendingPayments(
  wargaId,
  tahun
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
      .eq('tahun', tahun)
      .eq(
        'konfirmasi_pembayaran.status',
        'pending'
      )
      .order('bulan')

  if (error)
    throw error

  return data || []
}

export async function getRejectedPayments(
  wargaId,
  tahun
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
      .eq('tahun', tahun)
      .eq(
        'konfirmasi_pembayaran.status',
        'rejected'
      )
      .order('bulan')

  if (error)
    throw error

  return data || []
}

export async function approveKonfirmasi(
  konfirmasiId
) {

  const { error } =
    await supabase.rpc(
      'approve_konfirmasi',
      {
        p_konfirmasi_id:
          konfirmasiId
      }
    )

  if (error)
    throw error
}

export async function rejectKonfirmasi(
  konfirmasiId,
  alasan
) {

  const { error } =
    await supabase.rpc(
      'reject_konfirmasi',
      {
        p_konfirmasi_id:
          konfirmasiId,

        p_alasan: alasan
      }
    )

  if (error)
    throw error
}