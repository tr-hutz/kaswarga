interface ConfirmationFilters {
    year?: number | string | null
    rtId?: string | null
    residentId?: string | null
    status?: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyConfirmationFilters(query: any, { year, rtId, residentId, status }: ConfirmationFilters): any {

    /*
     |--------------------------------------------------------------------------
     | FILTER TAHUN
     |--------------------------------------------------------------------------
     */

    if (year) {

        query =
            query.eq(
                'year',
                year
            )
    }

    /*
     |--------------------------------------------------------------------------
     | FILTER RT
     |--------------------------------------------------------------------------
     */

    if (rtId) {

        query =
            query.eq(
                'rt_id',
                rtId
            )
    }

    /*
     |--------------------------------------------------------------------------
     | FILTER WARGA
     |--------------------------------------------------------------------------
     */

    if (residentId) {

        query =
            query.eq(
                'resident_id',
                residentId
            )
    }

    /*
     |--------------------------------------------------------------------------
     | FILTER STATUS
     |--------------------------------------------------------------------------
     */

    if (status) {

        query =
            query.eq(
                'status',
                status
            )
    }

    return query
}
