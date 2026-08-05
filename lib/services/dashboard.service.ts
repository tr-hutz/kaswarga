import {
  supabase
} from '../supabase'

import {
  getCurrentMembership
} from '../auth/getCurrentMembership'

import {
  MONTHS
} from '@/lib/constants/months'

import {
  findApprovedIncomesByYear
} from '../repositories/income-analytics.repository'


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

  /*
   |--------------------------------------------------------------------------
   | TOTAL RESIDENTS
   |--------------------------------------------------------------------------
   */

  const residentsQuery =
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

      .eq(
        'status',
        'approved'
      )

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const residentConfs = (confirmationData || []).filter((c: any) =>
          c.resident_id === resident.id &&
          c.status === 'pending'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ).map((c: any) => {
          const details = (c.confirmation_details || []) as { id: string; month: number; amount: number }[]
          const months  = details.map(d => Number(d.month)).sort((a, b) => a - b)
          return {
              id:          c.id as string,
              year:        c.year as number,
              status:      c.status as string,
              totalAmount: details.reduce((s, d) => s + Number(d.amount || 0), 0),
              proofUrl:    c.proof_url as string | null,
              name:        resident.name,
              block:       resident.block,
              houseNumber: resident.house_number,
              months,
              details:     details.map(d => ({ id: d.id, month: d.month })),
          }
      })

      return {

        id: resident.id,

        name: resident.name,

        block: resident.block,

        houseNumber:
          resident.house_number,

        paidCount,

        paidMonths:
          paidMonths.map(Number).sort((a: number, b: number) => a - b),

        arrears:
          Math.max(
            arrears,
            0
          ),

        upcoming,

        confirmations: residentConfs,

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

            const paid   = new Set<string>()
            let   amount = 0

            for (const payment of paymentData) {
                for (const detail of (payment.payment_details || [])) {
                    if (Number(detail.month) === Number(month.id)) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        paid.add((payment as any).resident_id)
                        amount += Number(detail.amount || 0)
                    }
                }
            }

            return {
                month:         month.short,
                amount,
                residentsPaid: paid.size,
            }

        })

  /*
   |--------------------------------------------------------------------------
   | EXPENSE BY CATEGORY
   |--------------------------------------------------------------------------
   */

  const categoryTotals: Record<string, number> = {}
  for (const e of expenseData) {
    const cat = e.category || 'Lainnya'
    categoryTotals[cat] = (categoryTotals[cat] ?? 0) + Number(e.amount ?? 0)
  }
  const expenseByCategory = Object.entries(categoryTotals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)

  const expenseCategories = expenseByCategory.map(e => e.category)

  /*
   |--------------------------------------------------------------------------
   | MONTHLY EXPENSE BY CATEGORY
   |--------------------------------------------------------------------------
   */

  const monthlyExpenseByCategory = MONTHS.map(month => {
    const values: Record<string, number> = {}
    for (const cat of expenseCategories) {
      values[cat] = expenseData
        .filter(e => {
          const m = new Date(e.date!).getMonth() + 1
          return m === month.id && (e.category || 'Lainnya') === cat
        })
        .reduce((s, e) => s + Number(e.amount ?? 0), 0)
    }
    return { month: month.short, values }
  })

  /*
   |--------------------------------------------------------------------------
   | INCOME ANALYTICS
   |--------------------------------------------------------------------------
   */

  let incomeData: Array<{ amount: number; income_category: string; received_at: string }> = []

  try {
    if (rtId) {
      incomeData = await findApprovedIncomesByYear(rtId, year)
    }
  } catch {
    // non-critical — dashboard still renders without income analytics
  }

  const currentMonth = new Date().getMonth() + 1
  const currentYear  = new Date().getFullYear()

  const incomeThisMonth = year === currentYear
    ? incomeData
        .filter(i => new Date(i.received_at).getMonth() + 1 === currentMonth)
        .reduce((s, i) => s + Number(i.amount ?? 0), 0)
    : 0

  const incomeThisYear = incomeData.reduce((s, i) => s + Number(i.amount ?? 0), 0)

  const incomeCategoryTotals: Record<string, number> = {}
  for (const i of incomeData) {
    const cat = i.income_category || 'OTHER'
    incomeCategoryTotals[cat] = (incomeCategoryTotals[cat] ?? 0) + Number(i.amount ?? 0)
  }

  const incomeByCategory = Object.entries(incomeCategoryTotals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)

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

    expenseByCategory,

    expenseCategories,

    monthlyExpenseByCategory,

    paymentData,

    confirmationData,

    incomeInsight: {
      incomeThisMonth,
      incomeThisYear,
      incomeByCategory,
    },

  }
}
