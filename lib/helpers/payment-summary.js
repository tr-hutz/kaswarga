import { PAYMENT_STATUS }
  from '../constants/payment-status'

export function calculateTunggakan(
  statusMap,
  tahun
) {

  const now = new Date()

  const currentYear =
    now.getFullYear()

  const currentMonth =
    now.getMonth() + 1

  const maxMonth =
    tahun === currentYear
      ? currentMonth
      : 12

  let total = 0

  for (
    let bulan = 1;
    bulan <= maxMonth;
    bulan++
  ) {

    const status =
      statusMap[bulan]

    if (
      status !== PAYMENT_STATUS.APPROVED
    ) {
      total++
    }
  }

  return total
}

export function calculateUpcoming(
  statusMap,
  tahun
) {

  const now = new Date()

  const currentYear =
    now.getFullYear()

  if (tahun !== currentYear)
    return 0

  const currentMonth =
    now.getMonth() + 1

  let total = 0

  for (
    let bulan = currentMonth + 1;
    bulan <= 12;
    bulan++
  ) {

    if (!statusMap[bulan]) {
      total++
    }
  }

  return total
}

export function calculatePaidMonths(
  statusMap
) {

  return Object.values(statusMap)
    .filter(
      status =>
        status === 'approved'
    )
    .length
}