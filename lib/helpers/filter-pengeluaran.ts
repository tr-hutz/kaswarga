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
            'active',
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
                'category',
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
                `description.ilike.%${search}%,category.ilike.%${search}%,recipient.ilike.%${search}%,receipt_number.ilike.%${search}%`
            )
    }

    return query
}