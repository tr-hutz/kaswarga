export function groupPaymentsByMonth(
  payments = []
) {

  const grouped = {}

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
  data = [],
  status
) {

  return data.map(item => ({
    month:  item.month,
    amount: item.amount,
    status
  }))
}
