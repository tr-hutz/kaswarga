'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react'
import { getExpenseCategories } from '@/lib/services/expense-category.service'

export function useExpenseCategories() {
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getExpenseCategories()
            .then(setCategories)
            .catch(err => console.error('[PENGELUARAN_KATEGORI]', err))
            .finally(() => setLoading(false))
    }, [])

    return { categories, loading }
}