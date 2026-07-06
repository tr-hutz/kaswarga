'use client'

import { useState } from 'react'

import PengeluaranView         from './PengeluaranView'
import { usePengeluaranData }     from './hooks/usePengeluaranData'
import { usePengeluaranRealtime } from './hooks/usePengeluaranRealtime'
import { usePengeluaranActions } from './hooks/usePengeluaranActions'
import { useToast }            from '@/components/ui/ToastProvider'
import { useAuth }             from '@/lib/auth/useAuth'

export default function PengeluaranContainer() {

    /*
     |-------------------------------------------------------------
     | AUTH
     |-------------------------------------------------------------
     */

    const { role } = useAuth()

    /*
     |-------------------------------------------------------------
     | FILTERS
     |-------------------------------------------------------------
     */

    const [search,   setSearch]   = useState('')
    const [kategori, setKategori] = useState('all')

    /*
     |-------------------------------------------------------------
     | DATA
     |-------------------------------------------------------------
     */

    const { rows, loading, refresh } = usePengeluaranData({ search, kategori })
    usePengeluaranRealtime({ onReload: refresh })

    /*
     |-------------------------------------------------------------
     | ACTIONS
     |-------------------------------------------------------------
     */

    const { toast } = useToast()

    const actions = usePengeluaranActions({

        onReload: refresh,

        onImportSuccess: (inserted) => {
            refresh()
            toast({ message: `${inserted} data pengeluaran berhasil diimpor.`, type: 'success' })
        },

        onApprovalSuccess: () => {
            refresh()
        },

    })

    /*
     |-------------------------------------------------------------
     | VIEW
     |-------------------------------------------------------------
     */

    return (
        <PengeluaranView
            search={search}
            setSearch={setSearch}
            kategori={kategori}
            setKategori={setKategori}
            role={role}
            rows={rows}
            loading={loading}
            {...actions}
        />
    )
}