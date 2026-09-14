import { PAYMENT_STATUS }
  from '@/lib/constants/payment-status'

type StatusMap = Record<string | number, string>

export function calculateArrears(
  statusMap: StatusMap,
  year: number
): number {

  const now = new Date()

  const currentYear =
    now.getFullYear()

  const currentMonth =
    now.getMonth() + 1

  const maxMonth =
    year === currentYear
      ? currentMonth
      : 12

  let total = 0

  for (
    let month = 1;
    month <= maxMonth;
    month++
  ) {

    const status =
      statusMap[month]

    if (
      status !== PAYMENT_STATUS.APPROVED
    ) {
      total++
    }
  }

  return total
}

export function calculateUpcoming(
  statusMap: StatusMap,
  year: number
): number {

  const now = new Date()

  const currentYear =
    now.getFullYear()

  if (year !== currentYear)
    return 0

  const currentMonth =
    now.getMonth() + 1

  let total = 0

  for (
    let month = currentMonth + 1;
    month <= 12;
    month++
  ) {

    if (!statusMap[month]) {
      total++
    }
  }

  return total
}

export function calculatePaidMonths(
  statusMap: StatusMap
): number {

  return Object.values(statusMap)
    .filter(
      status =>
        status === 'approved'
    )
    .length
}
