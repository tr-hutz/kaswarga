'use client'

import {
    useState
} from 'react'

import {

    exportLedgerToCSV,
    exportLedgerToExcel

} from '../services/ledger-export'

export function useLedgerActions() {

    /*
     |-------------------------------------------------------------
     | STATE
     |-------------------------------------------------------------
     */

    const [

        selectedRow,
        setSelectedRow

    ] = useState<any>(null)

    const [

        drawerOpen,
        setDrawerOpen

    ] = useState(false)

    /*
     |-------------------------------------------------------------
     | DRAWER
     |-------------------------------------------------------------
     */

    function openDrawer(row: any) {

        setSelectedRow(row)

        setDrawerOpen(true)
    }

    function closeDrawer() {

        setDrawerOpen(false)

        setSelectedRow(null)
    }

    /*
     |-------------------------------------------------------------
     | EXPORT
     |-------------------------------------------------------------
     */

    async function exportCSV(rows: any[]) {

        await exportLedgerToCSV(
            rows as any
        )
    }

    async function exportExcel(rows: any[]) {

        await exportLedgerToExcel(
            rows as any
        )
    }

    return {

        selectedRow,

        drawerOpen,

        openDrawer,
        closeDrawer,

        exportCSV,
        exportExcel
    }
}