interface PaymentFilters {
    year?: number | string | null
    rtId?: string | null
    residentId?: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyPaymentFilters(query: any, { year, rtId, residentId }: PaymentFilters = {}): any {

  if (year) {

    query =
        query.eq(
            'year',
            year
        )
  }

  if (rtId) {

    query =
        query.eq(
            'rt_id',
            rtId
        )
  }

  if (residentId) {

    query =
        query.eq(
            'resident_id',
            residentId
        )
  }

  return query
}
