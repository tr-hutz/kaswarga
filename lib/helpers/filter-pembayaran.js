export function applyPaymentFilters(

    query,

    {
      year,
      rtId,
      wargaId
    } = {}

) {

  if (year) {

    query =
        query.eq(
            'tahun',
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
            'warga_id',
            wargaId
        )
  }

  return query
}
