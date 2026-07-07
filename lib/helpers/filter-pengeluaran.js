export function applyExpenseFilters(

    query,

    {

        rtId,
        category,
        search,
        active = true

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
            active
        )

    /*
     |-------------------------------------------------------------
     | CATEGORY
     |-------------------------------------------------------------
     */

    if (
        category &&
        category !== 'all'
    ) {

        query =
            query.eq(
                'kategori',
                category
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