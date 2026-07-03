export function applyPengeluaranFilters(

    query,

    {

        rtId,
        kategori,
        search,
        aktif = true

    } = {}

) {

    /*
     |-------------------------------------------------------------
     | RT
     |-------------------------------------------------------------
     */

    if (rtId) {

        query =
            query.eq(
                'rt_id',
                rtId
            )
    }

    /*
     |-------------------------------------------------------------
     | STATUS
     |-------------------------------------------------------------
     */

    query =
        query.eq(
            'aktif',
            aktif
        )

    /*
     |-------------------------------------------------------------
     | KATEGORI
     |-------------------------------------------------------------
     */

    if (
        kategori &&
        kategori !== 'all'
    ) {

        query =
            query.eq(
                'kategori',
                kategori
            )
    }

    /*
     |-------------------------------------------------------------
     | SEARCH
     |-------------------------------------------------------------
     */

    if (search) {

        query =
            query.or(
                `deskripsi.ilike.%${search}%,kategori.ilike.%${search}%,penerima.ilike.%${search}%,nomor_bukti.ilike.%${search}%`
            )
    }

    return query
}