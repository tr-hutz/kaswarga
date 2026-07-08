import {
  supabase
} from '../supabase'

import {
  getCurrentMembership
} from '../auth/getCurrentMembership'

import {
  MONTHS
} from '../../constants/months'


/*
|--------------------------------------------------------------------------
| DASHBOARD DATA
|--------------------------------------------------------------------------
*/

export async function getDashboardData(
  year: number
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

  const residentId =
    membership.resident?.id || null

  /*
   |--------------------------------------------------------------------------
   | TOTAL RESIDENTS
   |--------------------------------------------------------------------------
   */

  let residentsQuery =
    supabase

      .from('residents')

      .select(`
        id,
        name,
        block,
        house_number
      `)

      .eq(
        'rt_id',
        rtId!
      )

      .order(
        'name',
        {
          ascending: true
        }
      )

  const {
    data: residentsData,
    error: residentsError
  } =
    await residentsQuery

  if (residentsError) {

    throw residentsError
  }

  /*
   |--------------------------------------------------------------------------
   | PAYMENTS
   |--------------------------------------------------------------------------
   */

  let paymentQuery = supabase
    .from('payments')
    .select(`
      id,
      date,
      year,
      resident_id,
      rt_id,

      payment_details:
      payment_details (
        id,
        month,
        amount,
        year
      )
    `)
    .eq(
      'year',
      year
    )
    .order(
      'date',
      {
        ascending: false
      }
    )

  /*
   |--------------------------------------------------------------------------
   | FILTER RESIDENT
   |--------------------------------------------------------------------------
   */

  if (
    role === 'RESIDENT'
    &&
    residentId
  ) {

    paymentQuery =
      paymentQuery.eq(
        'resident_id',
        residentId
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
   | CONFIRMATIONS
   |--------------------------------------------------------------------------
   */

  let confirmationQuery = supabase
    .from(
      'payment_confirmations'
    )
    .select(`
      id,
      status,
      year,
      proof_url,

      resident_id,
      rt_id,

      confirmation_details:
      confirmation_details (
        id,
        month,
        amount,
        year
      )
    `)
    .eq(
      'year',
      year
    )

  /*
   |--------------------------------------------------------------------------
   | FILTER RESIDENT
   |--------------------------------------------------------------------------
   */

  if (
    role === 'RESIDENT'
    &&
    residentId
  ) {

    confirmationQuery =
      confirmationQuery.eq(
        'resident_id',
        residentId
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
   | EXPENSES
   |--------------------------------------------------------------------------
   */

  let expenseQuery =
    supabase

      .from('expenses')

      .select(`
        id,
        category,
        description,
        amount,
        date
      `)

      .gte(
        'date',
        `${year}-01-01`
      )

      .lte(
        'date',
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
   | TOTAL INCOME
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
                            .payment_details || []
                    )

                        .reduce(

                            (
                                acc,
                                detail
                            ) => {

                                return (

                                    acc +

                                    Number(
                                        detail.amount || 0
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
   | TOTAL EXPENSES
   |--------------------------------------------------------------------------
   */

  const totalExpense =
    expenseData.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    )

  /*
   |--------------------------------------------------------------------------
   | CURRENT BALANCE (from ledger)
   |--------------------------------------------------------------------------
   */

  const { data: currentBalance = 0 } =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.rpc as any)(
      'get_last_balance',
      { p_rt_id: rtId }
    )

  /*
   |--------------------------------------------------------------------------
   | TOTAL ARREARS
   |--------------------------------------------------------------------------
   */

  const currentMonth =
    new Date().getMonth() + 1

  const monthlyFee =
    membership.rt?.monthly_fee || 0

  /*
   |--------------------------------------------------------------------------
   | RESIDENT PAYMENT ANALYTICS
   |--------------------------------------------------------------------------
   */

  const residentAnalytics =
    residentsData.map(resident => {

      /*
       * per-resident payments
       */

        const paidMonths =
            paymentData

                .filter(item => {

                    return (
                        item.resident_id ===
                        resident.id
                    )

                })

                .flatMap(item =>

                    (
                        item.payment_details || []
                    )

                        .map(detail =>
                            detail.month
                        )
                )

      /*
       * paid count
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

        id: resident.id,

        name: resident.name,

        block: resident.block,

        houseNumber:
          resident.house_number,

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
                                .payment_details || []
                        )

                            .filter(detail =>

                                Number(
                                    detail.month
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
                                        detail.amount || 0
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
                item.date!
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
                  item.amount || 0
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
                                    .payment_details || []
                            )

                                .filter(detail =>

                                    Number(
                                        detail.month
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
    residentAnalytics.reduce(
      (sum, w) => sum + w.arrears,
      0
    ) * monthlyFee

  return {

    role,

    rt:
      membership.rt,

    resident:
      membership.resident,

    insight: {

      totalResidents:
        residentsData.length,

      totalIncome,

      totalExpense,

      currentBalance:
        currentBalance || 0,

      totalArrears

    },

    residentAnalytics,

    cashflow,

    collection,

    paymentData,

    confirmationData

  }
}
