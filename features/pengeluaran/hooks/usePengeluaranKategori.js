'use client'

import { useEffect, useState } from 'react'
import { getExpenseCategories } from '../../../lib/services/pengeluaran-kategori.service'

export function useExpenseCategories() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getExpenseCategories()
            .then(setCategories)
            .catch(err => console.error('[PENGELUARAN_KATEGORI]', err))
            .finally(() => setLoading(false))
    }, [])

    return { categories, loading }
}