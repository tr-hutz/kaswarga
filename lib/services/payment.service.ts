import {supabase} from '../supabase'

import {getCurrentMembership} from '../auth/getCurrentMembership'

import {logActivity} from './activity-logger'

import {applyConfirmationFilters} from '../helpers/filter-konfirmasi'

import {applyPaymentFilters} from '../helpers/filter-pembayaran'

import {transformConfirmation, transformPayment} from '../../features/payment/services/payment-transform'

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

        resident:
        membership?.resident
    }
}

/*
|--------------------------------------------------------------------------
| HOME PAGE
|--------------------------------------------------------------------------
*/

export async function getApprovedPayments(
    residentId: string | null | undefined,
    year: number
) {

    const { rt } = await getMembershipContext()

    let query =
        supabase

            .from(
                'payment_details'
            )

            .select(`
        id,
        month,
        amount,

        payments!inner (
          id,
          date,
          year,
          resident_id,
          rt_id
        )
      `)

            .eq(
                'payments.year',
                year
            )

            .order(
                'month',
                {
                    ascending: true
                }
            )

    if (rt?.id) {

        query =
            query.eq(
                'payments.rt_id',
                rt.id
            )
    }

    if (residentId) {

        query =
            query.eq(
                'payments.resident_id',
                residentId
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
        month: item.month,
        amount: item.amount
    }))
}

export async function getPendingPayments(
    residentId: string | null | undefined,
    year: number
) {

    const { rt } = await getMembershipContext()

    let query =
        supabase

            .from(
                'confirmation_details'
            )

            .select(`
        id,
        month,
        amount,

        payment_confirmations!inner (
          id,
          status,
          year,
          resident_id,
          rt_id
        )
      `)

            .eq(
                'payment_confirmations.year',
                year
            )

            .eq(
                'payment_confirmations.status',
                'pending'
            )

            .order(
                'month',
                {
                    ascending: true
                }
            )

    if (rt?.id) {

        query =
            query.eq(
                'payment_confirmations.rt_id',
                rt.id
            )
    }

    if (residentId) {

        query =
            query.eq(
                'payment_confirmations.resident_id',
                residentId
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
    residentId: string | null | undefined,
    year: number
) {

    const { rt } = await getMembershipContext()

    let query =
        supabase

            .from(
                'confirmation_details'
            )

            .select(`
        id,
        month,
        amount,

        payment_confirmations!inner (
          id,
          status,
          year,
          resident_id,
          rt_id
        )
      `)

            .eq(
                'payment_confirmations.year',
                year
            )

            .eq(
                'payment_confirmations.status',
                'rejected'
            )

            .order(
                'month',
                {
                    ascending: true
                }
            )

    if (rt?.id) {

        query =
            query.eq(
                'payment_confirmations.rt_id',
                rt.id
            )
    }

    if (residentId) {

        query =
            query.eq(
                'payment_confirmations.resident_id',
                residentId
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
    year: number
) {

    const {
        role,
        rt,
        resident
    } = await getMembershipContext()

    /*
    |--------------------------------------------------------------------------
    | PAYMENTS
    |--------------------------------------------------------------------------
    */

    let paymentQuery =
        supabase

            .from('payments')

            .select(`
        id,
        date,
        year,
        rt_id,
        resident_id,

        payment_details:
        payment_details (
          id,
          month,
          amount
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
                    role === 'RESIDENT'
                        ? resident?.id
                        : null
            }
        )

    /*
    |--------------------------------------------------------------------------
    | EXPENSES
    |--------------------------------------------------------------------------
    */

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let expenseQuery: any =
        supabase

            .from('expenses')

            .select(`
        id,
        amount,
        date,
        category,
        rt_id
      `)

            .gte(
                'date',
                `${year}-01-01`
            )

            .lte(
                'date',
                `${year}-12-31`
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
                                .payment_details || []

                        const monthTotal =
                            detail

                                .filter(
                                    item =>
                                        item.month ===
                                        month.id
                                )

                                .reduce(
                                    (
                                        acc,
                                        item
                                    ) =>

                                        acc +
                                        (
                                            item.amount || 0
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
                        .payment_details || []

                const total =
                    detail.reduce(
                        (
                            acc,
                            item
                        ) =>

                            acc +
                            (
                                item.amount || 0
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
                sum: number,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                item: any
            ) =>

                sum +
                (item.amount || 0),

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
    year: number
) {

    const {
        role,
        rt,
        resident
    } = await getMembershipContext()

    let query =
        supabase

            .from('payments')

            .select(`
        id,
        resident_id,

        payment_details (
          id,
          month
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
                    role === 'RESIDENT'
                        ? resident?.id
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
    | TOTAL RESIDENTS
    |--------------------------------------------------------------------------
    */

    let residentsQuery =
        supabase

            .from('residents')

            .select(`
        id
      `)

    if (rt?.id) {

        residentsQuery =
            residentsQuery.eq(
                'rt_id',
                rt.id
            )
    }

    const {
        data: residentsData
    } = await residentsQuery

    const totalResidents =
        residentsData?.length || 0

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

    const paymentMap: Record<string, Set<number>> = {}

    payments.forEach(
        item => {

            if (
                !paymentMap[
                    item.resident_id
                    ]
            ) {

                paymentMap[
                    item.resident_id
                    ] = new Set()
            }

            item
                .payment_details
                ?.forEach(
                    detail => {

                        paymentMap[
                            item.resident_id
                            ]

                            .add(
                                detail.month
                            )
                    }
                )
        }
    )

    Object.values(
        paymentMap
    ).forEach(
        (monthSet: Set<number>) => {

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

        totalResidents,

        paid,

        almostPaid,

        delinquent,

        neverPaid
    }
}

/*
|--------------------------------------------------------------------------
| PAYMENTS PAGE
|--------------------------------------------------------------------------
*/

export async function getPayments(
    year: number
) {

    const {
        role,
        rt,
        resident
    } = await getMembershipContext()

    let query =
        supabase

            .from('payments')

            .select(`
        id,
        year,
        date,
        rt_id,
        resident_id,

        residents:
        residents!payments_resident_id_fkey (
          id,
          name,
          block,
          house_number
        ),

        payment_details:
        payment_details (
          id,
          month,
          amount
        )
      `)

            .order(
                'date',
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
                    role === 'RESIDENT'
                        ? resident?.id
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
    year: number
) {

    return getConfirmations(
        year,
        'pending'
    )
}

export async function getRejectedConfirmations(
    year: number
) {

    return getConfirmations(
        year,
        'rejected'
    )
}

async function getConfirmations(
    year: number,
    status: string
) {

    const {
        role,
        rt,
        resident
    } = await getMembershipContext()

    let query =
        supabase

            .from(
                'payment_confirmations'
            )

            .select(`
        id,
        year,
        status,
        total_amount,
        proof_url,
        created_at,
        rt_id,
        resident_id,

        residents:
        residents (
          id,
          name,
          block,
          house_number
        ),

        confirmation_details:
        confirmation_details (
          id,
          month,
          amount
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
                    role === 'RESIDENT'
                        ? resident?.id
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
    confirmationId: string
) {

    const [
        { data: { user } },
        membership
    ] = await Promise.all([
        supabase.auth.getUser(),
        getCurrentMembership()
    ])

    const { data: confirmation } =
        await supabase
            .from('payment_confirmations')
            .select('resident_id, year, total_amount, confirmation_details(month)')
            .eq('id', confirmationId)
            .single()

    const {
        data,
        error
    } = await supabase.rpc(
        'approve_konfirmasi',
        {
            p_confirmation_id: confirmationId,
            p_user_id:         user?.id ?? ''
        }
    )

    if (error) {
        throw error
    }

    logActivity({
        rtId:       membership?.rt?.id,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.name,
        action:     'APPROVE_PAYMENT',
        entityType: 'payment_confirmations',
        entityId:   confirmationId,
        description: `Setujui konfirmasi pembayaran`,
        metadata:   {
            confirmationId,
            residentId:  confirmation?.resident_id,
            year:        confirmation?.year,
            totalAmount: confirmation?.total_amount,
            months:      confirmation?.confirmation_details?.map(d => d.month) ?? []
        }
    })

    return data
}

export async function rejectPayment(
    confirmationId: string,
    reason: string | null | undefined
) {

    const [
        { data: { user } },
        membership
    ] = await Promise.all([
        supabase.auth.getUser(),
        getCurrentMembership()
    ])

    const { data: confirmation } =
        await supabase
            .from('payment_confirmations')
            .select('resident_id, year, total_amount, confirmation_details(month)')
            .eq('id', confirmationId)
            .single()

    const {
        data,
        error
    } = await supabase.rpc(
        'reject_konfirmasi',
        {
            p_confirmation_id: confirmationId,
            p_reason:          reason ?? '',
            p_user_id:         user?.id ?? ''
        }
    )

    if (error) {
        throw error
    }

    logActivity({
        rtId:       membership?.rt?.id,
        actorId:    membership?.user?.id,
        actorName:  membership?.user?.name,
        action:     'REJECT_PAYMENT',
        entityType: 'payment_confirmations',
        entityId:   confirmationId,
        description: `Tolak konfirmasi pembayaran${reason ? `: ${reason}` : ''}`,
        metadata:   {
            confirmationId,
            residentId:  confirmation?.resident_id,
            year:        confirmation?.year,
            totalAmount: confirmation?.total_amount,
            months:      confirmation?.confirmation_details?.map(d => d.month) ?? [],
            reason:      reason ?? null
        }
    })

    return data
}

export async function getPaymentConfirmations({
    year,
    status,
    search
}: {
    year?: number | null
    status?: string | null
    search?: string | null
}) {

    const {
        role,
        rt,
        resident
    } =
        await getMembershipContext()

    let query =
        supabase

            .from(
                'payment_confirmations'
            )

            .select(`

  id,
  year,
  status,
  total_amount,
  proof_url,
  created_at,

  rt_id,
  resident_id,

  residents:residents!inner (

    id,
    name,
    block,
    house_number

  ),

  confirmation_details:
  confirmation_details (

    id,
    month,
    amount

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
                'year',
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
        role === 'RESIDENT'
        &&
        resident?.id
    ) {

        query =
            query.eq(
                'resident_id',
                resident.id
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
                'residents.name',
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
