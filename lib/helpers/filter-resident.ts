interface ResidentFilters {
    rtId?: string | null
    search?: string | null
    status?: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyResidentFilters(query: any, { rtId, search, status }: ResidentFilters = {}): any {

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
     | SEARCH
     |-------------------------------------------------------------
     */

    if (search) {

        query =
            query.or(`name.ilike.%${search}%,block.ilike.%${search}%,house_number.ilike.%${search}%`)
    }

    /*
     |-------------------------------------------------------------
     | STATUS
     |-------------------------------------------------------------
     */

    if (status === 'active') {

        query =
            query.eq(
                'active',
                true
            )
    }

    if (status === 'inactive') {

        query =
            query.eq(
                'active',
                false
            )
    }

    return query
}