import { PAYMENT_STATUS }
  from '../constants/payment-status'

type StatusItem = { month: number | string }
type StatusMap = Record<string | number, string>

export function buildStatusMap({
  approved = [] as StatusItem[],
  pending  = [] as StatusItem[],
  rejected = [] as StatusItem[]
}): StatusMap {

  const map: StatusMap = {}

  for (const item of approved) {
    map[item.month] =
      PAYMENT_STATUS.APPROVED
  }

  for (const item of pending) {
    map[item.month] =
      PAYMENT_STATUS.PENDING
  }

  for (const item of rejected) {
    map[item.month] =
      PAYMENT_STATUS.REJECTED
  }

  return map
}
