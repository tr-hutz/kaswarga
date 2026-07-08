interface PaymentFilters {
    year?: number | string | null
    rtId?: string | null
    wargaId?: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyPaymentFilters(query: any, { year, rtId, wargaId }: PaymentFilters = {}): any {

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

  if (wargaId) {

    query =
        query.eq(
            'resident_id',
            wargaId
        )
  }

  return query
}
