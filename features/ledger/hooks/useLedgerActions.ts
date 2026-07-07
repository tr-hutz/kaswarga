// @ts-nocheck
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

    ] = useState(null)

    const [

        drawerOpen,
        setDrawerOpen

    ] = useState(false)

    /*
     |-------------------------------------------------------------
     | DRAWER
     |-------------------------------------------------------------
     */

    function openDrawer(row) {

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

    async function exportCSV(rows) {

        await exportLedgerToCSV(
            rows
        )
    }

    async function exportExcel(rows) {

        await exportLedgerToExcel(
            rows
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