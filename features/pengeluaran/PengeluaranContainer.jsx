'use client'

import { useState } from 'react'

import PengeluaranView         from './PengeluaranView'
import { useExpenseData }     from './hooks/usePengeluaranData'
import { useExpenseRealtime } from './hooks/usePengeluaranRealtime'
import { useExpenseActions } from './hooks/usePengeluaranActions'
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
    const [category, setKategori] = useState('all')

    /*
     |-------------------------------------------------------------
     | DATA
     |-------------------------------------------------------------
     */

    const { rows, loading, refresh } = useExpenseData({ search, category })
    useExpenseRealtime({ onReload: refresh })

    /*
     |-------------------------------------------------------------
     | ACTIONS
     |-------------------------------------------------------------
     */

    const { toast } = useToast()

    const actions = useExpenseActions({

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
            category={category}
            setKategori={setKategori}
            role={role}
            rows={rows}
            loading={loading}
            {...actions}
        />
    )
}