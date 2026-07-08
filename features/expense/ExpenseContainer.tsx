// @ts-nocheck
'use client'

import { useState } from 'react'

import ExpenseView         from './ExpenseView'
import { useExpenseData }     from './hooks/useExpenseData'
import { useExpenseRealtime } from './hooks/useExpenseRealtime'
import { useExpenseActions } from './hooks/useExpenseActions'
import { useToast }            from '@/components/ui/ToastProvider'
import { useAuth }             from '@/lib/auth/useAuth'

export default function ExpenseContainer() {

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
        <ExpenseView
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