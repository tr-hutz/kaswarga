interface ExpenseFilters {
    rtId?: string | null
    category?: string | null
    search?: string | null
    active?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyExpenseFilters(query: any, { rtId, category, search, active = true }: ExpenseFilters = {}): any {

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