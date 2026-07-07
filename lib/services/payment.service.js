import {supabase} from '../supabase'

import {getCurrentMembership} from '../auth/getCurrentMembership'

import {logActivity} from './activity-logger'

import {applyConfirmationFilters} from '../helpers/filter-konfirmasi'

import {applyPaymentFilters} from '../helpers/filter-pembayaran'

import {transformConfirmation, transformPayment} from '../../features/pembayaran/services/pembayaran-transform'

import {MONTHS} from '../../constants/months'

/*
|--------------------------------------------------------------------------
| SHARED MEMBERSHIP
|--------------------------------------------------------------------------
*/

async function getMembershipContext() {

    const membership =
        await getCurrentMembership()

    return {

        membership,

        role:
        membership?.role,

        rt:
        membership?.rt,

        warga:
        membership?.warga
    }
}

/*
|--------------------------------------------------------------------------
| HOME PAGE
|--------------------------------------------------------------------------
*/

export async function getApprovedPayments(
    wargaId,
    year
) {

    const { rt } = await getMembershipContext()

    let query =
        supabase

            .from(
                'detail_pembayaran'
            )

            .select(`
        id,
        bulan,
        nominal,

        pembayaran!inner (
          id,
          tanggal,
          tahun,
          warga_id,
          rt_id
        )
      `)

            .eq(
                'pembayaran.tahun',
                year
            )

            .order(
                'bulan',
                {
                    ascending: true
                }
            )

    if (rt?.id) {

        query =
            query.eq(
                'pembayaran.rt_id',
                rt.id
            )
    }

    if (wargaId) {

        query =
            query.eq(
                'pembayaran.warga_id',
                wargaId
            )
    }

    const {
        data,
        error
    } = await query

    if (error) {
        throw error
    }

    return (data || []).map(item => ({
        ...item,
        month: item.bulan,
        amount: item.nominal
    }))
}

export async function getPendingPayments(
    wargaId,
    year
) {

    const { rt } = await getMembershipContext()

    let query =
        supabase

            .from(
                'detail_konfirmasi_pembayaran'
            )

            .select(`
        id,
        bulan,
        nominal,

        konfirmasi_pembayaran!inner (
          id,
          status,
          tahun,
          warga_id,
          rt_id
        )
      `)

            .eq(
                'konfirmasi_pembayaran.tahun',
                year
            )

            .eq(
                'konfirmasi_pembayaran.status',
                'pending'
            )

            .order(
                'bulan',
                {
                    ascending: true
                }
            )

    if (rt?.id) {

        query =
            query.eq(
                'konfirmasi_pembayaran.rt_id',
                rt.id
            )
    }

    if (wargaId) {

        query =
            query.eq(
                'konfirmasi_pembayaran.warga_id',
                wargaId
            )
    }

    const {
        data,
        error
    } = await query

    if (error) {
        throw error
    }

    return data || []
}

export async function getRejectedPayments(
    wargaId,
    year
) {

    const { rt } = await getMembershipContext()

    let query =
        supabase

            .from(
                'detail_konfirmasi_pembayaran'
            )

            .select(`
        id,
        bulan,
        nominal,

        konfirmasi_pembayaran!inner (
          id,
          status,
          tahun,
          warga_id,
          rt_id
        )
      `)

            .eq(
                'konfirmasi_pembayaran.tahun',
                year
            )

            .eq(
                'konfirmasi_pembayaran.status',
                'rejected'
            )

            .order(
                'bulan',
                {
                    ascending: true
                }
            )

    if (rt?.id) {

        query =
            query.eq(
                'konfirmasi_pembayaran.rt_id',
                rt.id
            )
    }

    if (wargaId) {

        query =
            query.eq(
                'konfirmasi_pembayaran.warga_id',
                wargaId
            )
    }

    const {
        data,
        error
    } = await query

    if (error) {
        throw error
    }

    return data || []
}

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

export async function getDashboardAnalytics(
    year
) {

    const {
        role,
        rt,
        warga
    } = await getMembershipContext()

    /*
    |--------------------------------------------------------------------------
    | PEMBAYARAN
    |--------------------------------------------------------------------------
    */

    let paymentQuery =
        supabase

            .from('pembayaran')

            .select(`
        id,
        tanggal,
        tahun,
        rt_id,
        warga_id,

        detail_pembayaran:
        detail_pembayaran!detail_pembayaran_pembayaran_id_fkey (
          id,
          bulan,
          nominal
        )
      `)

    paymentQuery =
        applyPaymentFilters(
            paymentQuery,
            {
                year,

                rtId:
                rt?.id,

                wargaId:
                    role === 'warga'
                        ? warga?.id
                        : null
            }
        )

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
        jumlah,
        tanggal,
        kategori,
        rt_id
      `)

            .eq(
                'tahun',
                year
            )

    if (rt?.id) {

        expenseQuery =
            expenseQuery.eq(
                'rt_id',
                rt.id
            )
    }

    const [

        paymentResult,
        expenseResult

    ] = await Promise.all([

        paymentQuery,
        expenseQuery

    ])

    if (
        paymentResult.error
    ) {
        throw paymentResult.error
    }

    if (
        expenseResult.error
    ) {
        throw expenseResult.error
    }

    const payments =
        paymentResult.data || []

    const expenses =
        expenseResult.data || []

    /*
    |--------------------------------------------------------------------------
    | MONTHLY COLLECTION
    |--------------------------------------------------------------------------
    */

    const collection =
        MONTHS.map(month => {

            const total =
                payments.reduce(
                    (
                        sum,
                        paymentItem
                    ) => {

                        const detail =
                            paymentItem
                                .detail_pembayaran || []

                        const monthTotal =
                            detail

                                .filter(
                                    item =>
                                        item.bulan ===
                                        month.id
                                )

                                .reduce(
                                    (
                                        acc,
                                        item
                                    ) =>

                                        acc +
                                        (
                                            item.nominal || 0
                                        ),

                                    0
                                )

                        return (
                            sum +
                            monthTotal
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
    | CASHFLOW
    |--------------------------------------------------------------------------
    */

    const totalIncome =
        payments.reduce(
            (
                sum,
                paymentItem
            ) => {

                const detail =
                    paymentItem
                        .detail_pembayaran || []

                const total =
                    detail.reduce(
                        (
                            acc,
                            item
                        ) =>

                            acc +
                            (
                                item.nominal || 0
                            ),

                        0
                    )

                return (
                    sum + total
                )

            },

            0
        )

    const totalExpense =
        expenses.reduce(
            (
                sum,
                item
            ) =>

                sum +
                (
                    item.jumlah || 0
                ),

            0
        )

    return {

        collection,

        cashflow: [

            {
                name: 'Pemasukan',
                total:
                totalIncome
            },

            {
                name: 'Pengeluaran',
                total:
                totalExpense
            }

        ]
    }
}

/*
|--------------------------------------------------------------------------
| PAYMENT HEALTH
|--------------------------------------------------------------------------
*/

export async function getPaymentHealth(
    year
) {

    const {
        role,
        rt,
        warga
    } = await getMembershipContext()

    let query =
        supabase

            .from('pembayaran')

            .select(`
        id,
        warga_id,

        detail_pembayaran:
        detail_pembayaran!detail_pembayaran_pembayaran_id_fkey (
          id,
          bulan
        )
      `)

    query =
        applyPaymentFilters(
            query,
            {
                year,

                rtId:
                rt?.id,

                wargaId:
                    role === 'warga'
                        ? warga?.id
                        : null
            }
        )

    const {
        data,
        error
    } = await query

    if (error) {
        throw error
    }

    const payments =
        data || []

    /*
    |--------------------------------------------------------------------------
    | TOTAL WARGA
    |--------------------------------------------------------------------------
    */

    let wargaQuery =
        supabase

            .from('warga')

            .select(`
        id
      `)

    if (rt?.id) {

        wargaQuery =
            wargaQuery.eq(
                'rt_id',
                rt.id
            )
    }

    const {
        data: wargaData
    } = await wargaQuery

    const totalWarga =
        wargaData?.length || 0

    /*
    |--------------------------------------------------------------------------
    | PAYMENT SUMMARY
    |--------------------------------------------------------------------------
    */

    const currentMonth =
        new Date()
            .getMonth() + 1

    let paid = 0
    let almostPaid = 0
    let delinquent = 0
    let neverPaid = 0

    const paymentMap =
        {}

    payments.forEach(
        item => {

            if (
                !paymentMap[
                    item.warga_id
                    ]
            ) {

                paymentMap[
                    item.warga_id
                    ] = new Set()
            }

            item
                .detail_pembayaran
                ?.forEach(
                    detail => {

                        paymentMap[
                            item.warga_id
                            ]

                            .add(
                                detail.bulan
                            )
                    }
                )
        }
    )

    Object.values(
        paymentMap
    ).forEach(
        monthSet => {

            const paidCount =
                monthSet.size

            if (
                paidCount >=
                currentMonth
            ) {

                paid++

            } else if (
                paidCount >=
                currentMonth - 2
            ) {

                almostPaid++

            } else if (
                paidCount > 0
            ) {

                delinquent++

            } else {

                neverPaid++
            }
        }
    )

    return {

        totalWarga,

        paid,

        almostPaid,

        delinquent,

        neverPaid
    }
}

/*
|--------------------------------------------------------------------------
| PEMBAYARAN PAGE
|--------------------------------------------------------------------------
*/

export async function getPayments(
    year
) {

    const {
        role,
        rt,
        warga
    } = await getMembershipContext()

    let query =
        supabase

            .from('pembayaran')

            .select(`
        id,
        tahun,
        tanggal,
        rt_id,
        warga_id,

        warga:
        warga!pembayaran_warga_id_fkey (
          id,
          nama,
          blok,
          no_rumah
        ),

        detail_pembayaran:
        detail_pembayaran!detail_pembayaran_pembayaran_id_fkey (
          id,
          bulan,
          nominal
        )
      `)

            .order(
                'tanggal',
                {
                    ascending: false
                }
            )

    query =
        applyPaymentFilters(
            query,
            {
                year,

                rtId:
                rt?.id,

                wargaId:
                    role === 'warga'
                        ? warga?.id
                        : null
            }
        )

    const {
        data,
        error
    } = await query

    if (error) {
        throw error
    }

    return transformPayment(
        data
    )
}

export async function getPendingConfirmations(
    year
) {

    return getKonfirmasi(
        year,
        'pending'
    )
}

export async function getRejectedConfirmations(
    year
) {

    return getKonfirmasi(
        year,
        'rejected'
    )
}

async function getKonfirmasi(
    year,
    status
) {

    const {
        role,
        rt,
        warga
    } = await getMembershipContext()

    let query =
        supabase

            .from(
                'konfirmasi_pembayaran'
            )

            .select(`
        id,
        tahun,
        status,
        total_bayar,
        bukti_url,
        created_at,
        rt_id,
        warga_id,

        warga:
        warga (
          id,
          nama,
          blok,
          no_rumah
        ),

        detail_konfirmasi_pembayaran:
        detail_konfirmasi_pembayaran (
          id,
          bulan,
          nominal
        )
      `)

            .order(
                'created_at',
                {
                    ascending: false
                }
            )

    query =
        applyConfirmationFilters(
            query,
            {
                year,

                status,

                rtId:
                rt?.id,

                wargaId:
                    role === 'warga'
                        ? warga?.id
                        : null
            }
        )

    const {
        data,
        error
    } = await query

    if (error) {
        throw error
    }

    return transformConfirmation(
        data
    )
}

/*
|--------------------------------------------------------------------------
| APPROVAL ACTIONS
|--------------------------------------------------------------------------
*/

export async function approvePayment(
    konfirmasiId
) {

    const [
        { data: { user } },
        membership
    ] = await Promise.all([
        supabase.auth.getUser(),
        getCurrentMembership()
    ])

    const { data: konfirmasi } =
        await supabase
            .from('konfirmasi_pembayaran')
            .select('warga_id, tahun, total_bayar, detail_konfirmasi_pembayaran(bulan)')
            .eq('id', konfirmasiId)
            .single()

    const {
        data,
        error
    } = await supabase.rpc(
        'approve_konfirmasi',
        {
            p_konfirmasi_id: konfirmasiId,
            p_user_id:       user?.id
        }
    )

    if (error) {
        throw error
    }

    logActivity({
        rtId:       membership?.rt?.id,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.nama,
        action:     'APPROVE_PEMBAYARAN',
        entityType: 'konfirmasi_pembayaran',
        entityId:   konfirmasiId,
        description: `Setujui konfirmasi pembayaran`,
        metadata:   {
            konfirmasiId,
            wargaId:     konfirmasi?.warga_id,
            year:        konfirmasi?.tahun,
            totalAmount: konfirmasi?.total_bayar,
            months:      konfirmasi?.detail_konfirmasi_pembayaran?.map(d => d.bulan) ?? []
        }
    })

    return data
}

export async function rejectPayment(
    konfirmasiId,
    alasan
) {

    const [
        { data: { user } },
        membership
    ] = await Promise.all([
        supabase.auth.getUser(),
        getCurrentMembership()
    ])

    const { data: konfirmasi } =
        await supabase
            .from('konfirmasi_pembayaran')
            .select('warga_id, tahun, total_bayar, detail_konfirmasi_pembayaran(bulan)')
            .eq('id', konfirmasiId)
            .single()

    const {
        data,
        error
    } = await supabase.rpc(
        'reject_konfirmasi',
        {
            p_konfirmasi_id: konfirmasiId,
            p_alasan:        alasan,
            p_user_id:       user?.id
        }
    )

    if (error) {
        throw error
    }

    logActivity({
        rtId:       membership?.rt?.id,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.nama,
        action:     'REJECT_PEMBAYARAN',
        entityType: 'konfirmasi_pembayaran',
        entityId:   konfirmasiId,
        description: `Tolak konfirmasi pembayaran${alasan ? `: ${alasan}` : ''}`,
        metadata:   {
            konfirmasiId,
            wargaId:     konfirmasi?.warga_id,
            year:        konfirmasi?.tahun,
            totalAmount: konfirmasi?.total_bayar,
            months:      konfirmasi?.detail_konfirmasi_pembayaran?.map(d => d.bulan) ?? [],
            reason:      alasan ?? null
        }
    })

    return data
}

export async function getPaymentConfirmations({

                                                  year,
                                                  status,
                                                  search

                                              }) {

    const {
        role,
        rt,
        warga
    } =
        await getMembershipContext()

    let query =
        supabase

            .from(
                'konfirmasi_pembayaran'
            )

            .select(`

  id,
  tahun,
  status,
  total_bayar,
  bukti_url,
  created_at,

  rt_id,
  warga_id,

  warga:warga!inner (

    id,
    nama,
    blok,
    no_rumah

  ),

  detail_konfirmasi_pembayaran:
  detail_konfirmasi_pembayaran!detail_konfirmasi_pembayaran_konfirmasi_id_fkey (

    id,
    bulan,
    nominal

  )

`)

            .order(
                'created_at',
                {
                    ascending: false
                }
            )

    /*
     |------------------------------------------------------------------
     | FILTERS
     |------------------------------------------------------------------
     */

    if (year) {

        query =
            query.eq(
                'tahun',
                year
            )
    }

    if (status && status !== 'all') {

        query =
            query.eq(
                'status',
                status
            )
    }

    if (rt?.id) {

        query =
            query.eq(
                'rt_id',
                rt.id
            )
    }

    if (
        role === 'warga'
        &&
        warga?.id
    ) {

        query =
            query.eq(
                'warga_id',
                warga.id
            )
    }

    /*
     |------------------------------------------------------------------
     | SEARCH
     |------------------------------------------------------------------
     */

    if (search) {

        query =
            query.ilike(
                'warga.nama',
                `%${search}%`
            )
    }

    const {
        data,
        error
    } = await query

    if (error) {
        throw error
    }

    return transformConfirmation(
        data || []
    )
}