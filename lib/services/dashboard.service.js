import {
  supabase
} from '../supabase'

import {
  getCurrentMembership
} from '../auth/getCurrentMembership'

import {
  applyPaymentFilters
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
  year
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

  let paymentQuery = supabase
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
      year
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

    paymentQuery =
      paymentQuery.eq(
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

    paymentQuery =
      paymentQuery.eq(
        'rt_id',
        rtId
      )
  }

  const {
    data: paymentData,
    error: paymentError
  } =
    await paymentQuery

  if (paymentError) {

    throw paymentError
  }

  /*
   |--------------------------------------------------------------------------
   | DETAIL KONFIRMASI
   |--------------------------------------------------------------------------
   */

  let confirmationQuery = supabase
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
      year
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

    confirmationQuery =
      confirmationQuery.eq(
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

    confirmationQuery =
      confirmationQuery.eq(
        'rt_id',
        rtId
      )
  }

  const {
    data: confirmationData,
    error: confirmationError
  } =
    await confirmationQuery

  if (confirmationError) {

    throw confirmationError
  }

  /*
   |--------------------------------------------------------------------------
   | PENGELUARAN
   |--------------------------------------------------------------------------
   */

  let expenseQuery =
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
        `${year}-01-01`
      )

      .lte(
        'tanggal',
        `${year}-12-31`
      )

  if (rtId) {

    expenseQuery =
      expenseQuery.eq(
        'rt_id',
        rtId
      )
  }

  const {
    data: expenseData,
    error: expenseError
  } =
    await expenseQuery

  if (expenseError) {

    throw expenseError
  }

  /*
   |--------------------------------------------------------------------------
   | TOTAL PEMASUKAN
   |--------------------------------------------------------------------------
   */

    const totalIncome =
        paymentData.reduce(

            (
                sum,
                payment
            ) => {

                const totalDetail =
                    (
                        payment
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

  const totalExpense =
    expenseData.reduce(
      (sum, item) => sum + (item.nominal || 0),
      0
    )

  /*
   |--------------------------------------------------------------------------
   | SALDO TERKINI (from ledger)
   |--------------------------------------------------------------------------
   */

  const { data: currentBalance = 0 } =
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

  const monthlyFee =
    membership.rt?.nominal_iuran || 0

  /*
   |--------------------------------------------------------------------------
   | STATUS PEMBAYARAN WARGA
   |--------------------------------------------------------------------------
   */

  const wargaAnalytics =
    wargaData.map(warga => {

      /*
       * per-warga payments
       */

        const paidMonths =
            paymentData

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

      const paidCount =
        paidMonths.length

      /*
       * arrears
       */

      const arrears =
        currentMonth -
        paidCount

      /*
       * upcoming
       */

      const upcoming =
        12 -
        currentMonth

      return {

        id: warga.id,

        name: warga.nama,

        block: warga.blok,

        houseNumber:
          warga.no_rumah,

        paidCount,

        arrears:
          Math.max(
            arrears,
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

      const monthId =
        month.id

        const income =
            paymentData.reduce(

                (
                    sum,
                    payment
                ) => {

                    const monthlyTotal =

                        (
                            payment
                                .detail_pembayaran || []
                        )

                            .filter(detail =>

                                Number(
                                    detail.bulan
                                ) ===

                                Number(
                                    monthId
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

      const expense =
        expenseData

          .filter(item => {

            const itemMonth =
              new Date(
                item.tanggal
              )
                .getMonth() + 1

            return (
              itemMonth ===
              monthId
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

        month:
          month.short,

        income,

        expense,

        balance:
          income -
          expense

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
                paymentData.reduce(

                    (
                        sum,
                        payment
                    ) => {

                        const monthlyCount =

                            (
                                payment
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

                month:
                month.short,

                total

            }

        })

  /*
   |--------------------------------------------------------------------------
   | RETURN
   |--------------------------------------------------------------------------
   */

  const totalArrears =
    wargaAnalytics.reduce(
      (sum, w) => sum + w.arrears,
      0
    ) * monthlyFee

  return {

    role,

    rt:
      membership.rt,

    warga:
      membership.warga,

    insight: {

      totalWarga:
        wargaData.length,

      totalIncome,

      totalExpense,

      currentBalance:
        currentBalance || 0,

      totalArrears

    },

    wargaAnalytics,

    cashflow,

    collection,

    paymentData,

    confirmationData

  }
}