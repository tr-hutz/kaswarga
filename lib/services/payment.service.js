import {supabase} from '../supabase'

import {getCurrentMembership} from '../auth/getCurrentMembership'

import {logActivity} from './activity-logger'

import {applyKonfirmasiFilters} from '../helpers/filter-konfirmasi'

import {applyPembayaranFilters} from '../helpers/filter-pembayaran'

import {transformKonfirmasi, transformPembayaran} from '../../features/pembayaran/services/pembayaran-transform'

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
    tahun
) {

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
                tahun
            )

            .order(
                'bulan',
                {
                    ascending: true
                }
            )

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

    return data || []
}

export async function getPendingPayments(
    wargaId,
    tahun
) {

    let query =
        supabase

            .from(
                'detail_konfirmasi_pembayaran'
            )

            .select(`
        id,
        bulan,
        nominal,

        konfirmasi_pembayaran (
          id,
          status,
          tahun,
          warga_id,
          rt_id
        )
      `)

            .eq(
                'konfirmasi_pembayaran.tahun',
                tahun
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
    tahun
) {

    let query =
        supabase

            .from(
                'detail_konfirmasi_pembayaran'
            )

            .select(`
        id,
        bulan,
        nominal,

        konfirmasi_pembayaran (
          id,
          status,
          tahun,
          warga_id,
          rt_id
        )
      `)

            .eq(
                'konfirmasi_pembayaran.tahun',
                tahun
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
    tahun
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

    let pembayaranQuery =
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

    pembayaranQuery =
        applyPembayaranFilters(
            pembayaranQuery,
            {
                tahun,

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

    let pengeluaranQuery =
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
                tahun
            )

    if (rt?.id) {

        pengeluaranQuery =
            pengeluaranQuery.eq(
                'rt_id',
                rt.id
            )
    }

    const [

        pembayaranResult,
        pengeluaranResult

    ] = await Promise.all([

        pembayaranQuery,
        pengeluaranQuery

    ])

    if (
        pembayaranResult.error
    ) {
        throw pembayaranResult.error
    }

    if (
        pengeluaranResult.error
    ) {
        throw pengeluaranResult.error
    }

    const pembayaran =
        pembayaranResult.data || []

    const pengeluaran =
        pengeluaranResult.data || []

    /*
    |--------------------------------------------------------------------------
    | MONTHLY COLLECTION
    |--------------------------------------------------------------------------
    */

    const collection =
        MONTHS.map(month => {

            const total =
                pembayaran.reduce(
                    (
                        sum,
                        pembayaranItem
                    ) => {

                        const detail =
                            pembayaranItem
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

    const totalPemasukan =
        pembayaran.reduce(
            (
                sum,
                pembayaranItem
            ) => {

                const detail =
                    pembayaranItem
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

    const totalPengeluaran =
        pengeluaran.reduce(
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
                totalPemasukan
            },

            {
                name: 'Pengeluaran',
                total:
                totalPengeluaran
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
    tahun
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
        applyPembayaranFilters(
            query,
            {
                tahun,

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

    const pembayaran =
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

    let lunas = 0
    let hampirLunas = 0
    let menunggak = 0
    let belumBayar = 0

    const paymentMap =
        {}

    pembayaran.forEach(
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
        bulanSet => {

            const jumlahBayar =
                bulanSet.size

            if (
                jumlahBayar >=
                currentMonth
            ) {

                lunas++

            } else if (
                jumlahBayar >=
                currentMonth - 2
            ) {

                hampirLunas++

            } else if (
                jumlahBayar > 0
            ) {

                menunggak++

            } else {

                belumBayar++
            }
        }
    )

    return {

        totalWarga,

        lunas,

        hampirLunas,

        menunggak,

        belumBayar
    }
}

/*
|--------------------------------------------------------------------------
| PEMBAYARAN PAGE
|--------------------------------------------------------------------------
*/

export async function getPembayaran(
    tahun
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
        applyPembayaranFilters(
            query,
            {
                tahun,

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

    return transformPembayaran(
        data
    )
}

export async function getPendingKonfirmasi(
    tahun
) {

    return getKonfirmasi(
        tahun,
        'pending'
    )
}

export async function getRejectedKonfirmasi(
    tahun
) {

    return getKonfirmasi(
        tahun,
        'rejected'
    )
}

async function getKonfirmasi(
    tahun,
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
        applyKonfirmasiFilters(
            query,
            {
                tahun,

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

    return transformKonfirmasi(
        data
    )
}

/*
|--------------------------------------------------------------------------
| APPROVAL ACTIONS
|--------------------------------------------------------------------------
*/

export async function approvePembayaran(
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
            konfirmasi_id: konfirmasiId,
            warga_id:      konfirmasi?.warga_id,
            tahun:         konfirmasi?.tahun,
            total_bayar:   konfirmasi?.total_bayar,
            bulan:         konfirmasi?.detail_konfirmasi_pembayaran?.map(d => d.bulan) ?? []
        }
    })

    return data
}

export async function rejectPembayaran(
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
            konfirmasi_id: konfirmasiId,
            warga_id:      konfirmasi?.warga_id,
            tahun:         konfirmasi?.tahun,
            total_bayar:   konfirmasi?.total_bayar,
            bulan:         konfirmasi?.detail_konfirmasi_pembayaran?.map(d => d.bulan) ?? [],
            alasan:        alasan ?? null
        }
    })

    return data
}

export async function getKonfirmasiPembayaran({

                                                  tahun,
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

    if (tahun) {

        query =
            query.eq(
                'tahun',
                tahun
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

    return transformKonfirmasi(
        data || []
    )
}