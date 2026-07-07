export const PAYMENT_STATUS = {
  APPROVED: 'approved',
  PENDING: 'pending',
  REJECTED: 'rejected',
  UNPAID: 'unpaid'
} as const

export type PaymentStatusValue = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS]