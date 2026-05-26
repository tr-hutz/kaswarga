export function applyPembayaranFilters(

    query,

    {
      tahun,
      rtId,
      wargaId
    } = {}

) {

  if (tahun) {

    query =
        query.eq(
            'tahun',
            tahun
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