'use client'

import {
    useState
} from 'react'

export function useResidentFilters() {

    const [
        search,
        setSearch
    ] = useState('')

    const [
        status,
        setStatus
    ] = useState('')

    return {

        search,
        setSearch,

        status,
        setStatus
    }
}