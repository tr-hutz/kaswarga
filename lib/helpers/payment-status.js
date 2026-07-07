import { PAYMENT_STATUS }
  from '../constants/payment-status'

export function buildStatusMap({
  approved = [],
  pending = [],
  rejected = []
}) {

  const map = {}

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
