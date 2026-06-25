import {
  supabase
} from '../supabase'

import {
  getCurrentMembership
} from '../auth/getCurrentMembership'

import {
  applyPembayaranFilters
} from '../helpers/filter-pembayaran'

import {
  MONTHS
} from '../../constants/months'


/*
|--------------------------------------------------------------------------
| DASHBOARD DATA
|--------------------------------------------------------------------------
*/

export async function getDashboardData(
  tahun
) {

  /*
   |--------------------------------------------------------------------------
   | MEMBERSHIP
   |--------------------------------------------------------------------------
   */

  const membership =
    await getCurrentMembership()

  const role =
    membership.role

  const rtId =
    membership.rt?.id

  const wargaId =
    membership.warga?.id || null

  /*
   |--------------------------------------------------------------------------
   | TOTAL WARGA
   |--------------------------------------------------------------------------
   */

  let wargaQuery =
    supabase

      .from('warga')

      .select(`
        id,
        nama,
        blok,
        no_rumah
      `)

      .eq(
        'rt_id',
        rtId
      )

      .order(
        'nama',
        {
          ascending: true
        }
      )

  const {
    data: wargaData,
    error: wargaError
  } =
    await wargaQuery

  if (wargaError) {

    throw wargaError
  }

  /*
   |--------------------------------------------------------------------------
   | DETAIL PEMBAYARAN
   |--------------------------------------------------------------------------
   */

  let pembayaranQuery = supabase
    .from('pembayaran')
    .select(`
      id,
      tanggal,
      tahun,
      warga_id,
      rt_id,

      detail_pembayaran:
      detail_pembayaran!detail_pembayaran_pembayaran_id_fkey (
        id,
        bulan,
        nominal,
        tahun
      )
    `)
    .eq(
      'tahun',
      tahun
    )
    .order(
      'tanggal',
      {
        ascending: false
      }
    )

  /*
   |--------------------------------------------------------------------------
   | FILTER WARGA
   |--------------------------------------------------------------------------
   */

  if (
    role === 'warga'
    &&
    wargaId
  ) {

    pembayaranQuery =
      pembayaranQuery.eq(
        'warga_id',
        wargaId
      )
  }

  /*
   |--------------------------------------------------------------------------
   | FILTER RT
   |--------------------------------------------------------------------------
   */

  if (rtId) {

    pembayaranQuery =
      pembayaranQuery.eq(
        'rt_id',
        rtId
      )
  }

  const {
    data: pembayaranData,
    error: pembayaranError
  } =
    await pembayaranQuery

  if (pembayaranError) {

    throw pembayaranError
  }

  /*
   |--------------------------------------------------------------------------
   | DETAIL KONFIRMASI
   |--------------------------------------------------------------------------
   */

  let konfirmasiQuery = supabase
    .from(
      'konfirmasi_pembayaran'
    )
    .select(`
      id,
      status,
      tahun,
      bukti_url,

      warga_id,
      rt_id,

      detail_konfirmasi_pembayaran:
      detail_konfirmasi_pembayaran!detail_konfirmasi_pembayaran_konfirmasi_id_fkey (
        id,
        bulan,
        nominal,
        tahun
      )
    `)
    .eq(
      'tahun',
      tahun
    )

  /*
   |--------------------------------------------------------------------------
   | FILTER WARGA
   |--------------------------------------------------------------------------
   */

  if (
    role === 'warga'
    &&
    wargaId
  ) {

    konfirmasiQuery =
      konfirmasiQuery.eq(
        'warga_id',
        wargaId
      )
  }

  /*
   |--------------------------------------------------------------------------
   | FILTER RT
   |--------------------------------------------------------------------------
   */

  if (rtId) {

    konfirmasiQuery =
      konfirmasiQuery.eq(
        'rt_id',
        rtId
      )
  }

  const {
    data: konfirmasiData,
    error: konfirmasiError
  } =
    await konfirmasiQuery

  if (konfirmasiError) {

    throw konfirmasiError
  }

  /*
   |--------------------------------------------------------------------------
   | PENGELUARAN
   |--------------------------------------------------------------------------
   */

  let pengeluaranQuery =
    supabase

      .from('pengeluaran')

      .select(`
        id,
        kategori,
        deskripsi,
        nominal,
        tanggal
      `)

      .gte(
        'tanggal',
        `${tahun}-01-01`
      )

      .lte(
        'tanggal',
        `${tahun}-12-31`
      )

  if (rtId) {

    pengeluaranQuery =
      pengeluaranQuery.eq(
        'rt_id',
        rtId
      )
  }

  const {
    data: pengeluaranData,
    error: pengeluaranError
  } =
    await pengeluaranQuery

  if (pengeluaranError) {

    throw pengeluaranError
  }

  /*
   |--------------------------------------------------------------------------
   | TOTAL PEMASUKAN
   |--------------------------------------------------------------------------
   */

    const totalPemasukan =
        pembayaranData.reduce(

            (
                sum,
                pembayaran
            ) => {

                const totalDetail =
                    (
                        pembayaran
                            .detail_pembayaran || []
                    )

                        .reduce(

                            (
                                acc,
                                detail
                            ) => {

                                return (

                                    acc +

                                    Number(
                                        detail.nominal || 0
                                    )

                                )

                            },

                            0
                        )

                return (
                    sum +
                    totalDetail
                )

            },

            0
        )

  /*
   |--------------------------------------------------------------------------
   | TOTAL PENGELUARAN
   |--------------------------------------------------------------------------
   */

  const totalPengeluaran =
    pengeluaranData.reduce(
      (sum, item) => sum + (item.nominal || 0),
      0
    )

  /*
   |--------------------------------------------------------------------------
   | SALDO TERKINI (from ledger)
   |--------------------------------------------------------------------------
   */

  const { data: saldoTerkini = 0 } =
    await supabase.rpc(
      'get_last_saldo',
      { p_rt_id: rtId }
    )

  /*
   |--------------------------------------------------------------------------
   | TOTAL TUNGGAKAN
   |--------------------------------------------------------------------------
   */

  const currentMonth =
    new Date().getMonth() + 1

  const nominalIuran =
    membership.rt?.nominal_iuran || 0

  /*
   |--------------------------------------------------------------------------
   | STATUS PEMBAYARAN WARGA
   |--------------------------------------------------------------------------
   */

  const wargaAnalytics =
    wargaData.map(warga => {

      /*
       * pembayaran warga
       */

        const paidMonths =
            pembayaranData

                .filter(item => {

                    return (
                        item.warga_id ===
                        warga.id
                    )

                })

                .flatMap(item =>

                    (
                        item.detail_pembayaran || []
                    )

                        .map(detail =>
                            detail.bulan
                        )
                )

      /*
       * jumlah bayar
       */

      const totalBayar =
        paidMonths.length

      /*
       * tunggakan
       */

      const tunggakan =
        currentMonth -
        totalBayar

      /*
       * upcoming
       */

      const upcoming =
        12 -
        currentMonth

      return {

        id: warga.id,

        nama: warga.nama,

        blok: warga.blok,

        no_rumah:
          warga.no_rumah,

        totalBayar,

        tunggakan:
          Math.max(
            tunggakan,
            0
          ),

        upcoming

      }

    })

  /*
   |--------------------------------------------------------------------------
   | CASHFLOW CHART
   |--------------------------------------------------------------------------
   */

  const cashflow =
    MONTHS.map(month => {

      const bulan =
        month.id

        const pemasukan =
            pembayaranData.reduce(

                (
                    sum,
                    pembayaran
                ) => {

                    const monthlyTotal =

                        (
                            pembayaran
                                .detail_pembayaran || []
                        )

                            .filter(detail =>

                                Number(
                                    detail.bulan
                                ) ===

                                Number(
                                    bulan
                                )
                            )

                            .reduce(

                                (
                                    acc,
                                    detail
                                ) =>

                                    acc +

                                    Number(
                                        detail.nominal || 0
                                    ),

                                0
                            )

                    return (
                        sum +
                        monthlyTotal
                    )

                },

                0
            )

      const pengeluaran =
        pengeluaranData

          .filter(item => {

            const itemMonth =
              new Date(
                item.tanggal
              )
                .getMonth() + 1

            return (
              itemMonth ===
              bulan
            )

          })

          .reduce(
            (sum, item) => {

              return (
                sum +
                (
                  item.jumlah || 0
                )
              )

            },
            0
          )

      return {

        bulan:
          month.short,

        pemasukan,

        pengeluaran,

        saldo:
          pemasukan -
          pengeluaran

      }

    })

  /*
   |--------------------------------------------------------------------------
   | COLLECTION CHART
   |--------------------------------------------------------------------------
   */

    const collection =
        MONTHS.map(month => {

            const total =
                pembayaranData.reduce(

                    (
                        sum,
                        pembayaran
                    ) => {

                        const monthlyCount =

                            (
                                pembayaran
                                    .detail_pembayaran || []
                            )

                                .filter(detail =>

                                    Number(
                                        detail.bulan
                                    ) ===

                                    Number(
                                        month.id
                                    )
                                )

                                .length

                        return (
                            sum +
                            monthlyCount
                        )

                    },

                    0
                )

            return {

                bulan:
                month.short,

                total

            }

        })

  /*
   |--------------------------------------------------------------------------
   | RETURN
   |--------------------------------------------------------------------------
   */

  const totalTunggakan =
    wargaAnalytics.reduce(
      (sum, w) => sum + w.tunggakan,
      0
    ) * nominalIuran

  return {

    role,

    rt:
      membership.rt,

    warga:
      membership.warga,

    insight: {

      totalWarga:
        wargaData.length,

      totalPemasukan,

      totalPengeluaran,

      saldoTerkini:
        saldoTerkini || 0,

      totalTunggakan

    },

    wargaAnalytics,

    cashflow,

    collection,

    pembayaranData,

    konfirmasiData

  }
}