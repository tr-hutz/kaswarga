interface PaymentItem {
  month: number | string
  [key: string]: unknown
}

type GroupedPayments = Record<string | number, PaymentItem[]>

export function groupPaymentsByMonth(
  payments: PaymentItem[] = []
): GroupedPayments {

  const grouped: GroupedPayments = {}

  for (const item of payments) {

    if (!grouped[item.month]) {
      grouped[item.month] = []
    }

    grouped[item.month]
      .push(item)
  }

  return grouped
}

export function transformStatusArray(
  data: PaymentItem[] = [],
  status: string
) {

  return data.map(item => ({
    month:  item.month,
    amount: item.amount,
    status
  }))
}
