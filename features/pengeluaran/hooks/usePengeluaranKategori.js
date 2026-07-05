'use client'

import { useEffect, useState } from 'react'
import { getPengeluaranKategori } from '../../../lib/services/pengeluaran-kategori.service'

export function usePengeluaranKategori() {
    const [kategori, setKategori] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getPengeluaranKategori()
            .then(setKategori)
            .catch(err => console.error('[PENGELUARAN_KATEGORI]', err))
            .finally(() => setLoading(false))
    }, [])

    return { kategori, loading }
}