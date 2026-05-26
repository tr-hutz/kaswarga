export function groupPaymentsByMonth(
  payments = []
) {

  const grouped = {}

  for (const item of payments) {

    if (!grouped[item.bulan]) {
      grouped[item.bulan] = []
    }

    grouped[item.bulan]
      .push(item)
  }

  return grouped
}

export function transformStatusArray(
  data = [],
  status
) {

  return data.map(item => ({
    bulan: item.bulan,
    nominal: item.nominal,
    status
  }))
}