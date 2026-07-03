'use client'

import {
    useState
} from 'react'

import {

    exportWargaToExcel,
    exportWargaToCSV

} from '../services/warga-export-transform'

import { useWargaImport } from './useWargaImport'

export function useWargaActions(onImportSuccess) {

    /*
     |------------------------------------------------------------------
     | STATE
     |------------------------------------------------------------------
     */

    const [

        selectedWarga,
        setSelectedWarga

    ] = useState(null)

    const [

        drawerOpen,
        setDrawerOpen

    ] = useState(false)

    const [

        formOpen,
        setFormOpen

    ] = useState(false)

    /*
     |------------------------------------------------------------------
     | DRAWER
     |------------------------------------------------------------------
     */

    function openDrawer(
        warga
    ) {

        setSelectedWarga(
            warga
        )

        setDrawerOpen(true)
    }

    function closeDrawer() {

        setDrawerOpen(false)

        setSelectedWarga(null)
    }

    /*
     |------------------------------------------------------------------
     | FORM
     |------------------------------------------------------------------
     */

    function openCreateForm() {

        setSelectedWarga(null)

        setFormOpen(true)
    }

    function openEditForm(
        warga
    ) {

        setSelectedWarga(
            warga
        )

        setFormOpen(true)
    }

    function closeForm() {

        setFormOpen(false)
    }

    /*
     |------------------------------------------------------------------
     | EXPORT
     |------------------------------------------------------------------
     */

    async function exportExcel(data) {
        await exportWargaToExcel(data)
    }

    async function exportCSV(data) {
        await exportWargaToCSV(data)
    }

    /*
     |------------------------------------------------------------------
     | IMPORT
     |------------------------------------------------------------------
     */

    const importState = useWargaImport(onImportSuccess)

    /*
     |------------------------------------------------------------------
     | RETURN
     |------------------------------------------------------------------
     */

    return {

        selectedWarga,

        drawerOpen,
        openDrawer,
        closeDrawer,

        formOpen,
        openCreateForm,
        openEditForm,
        closeForm,

        exportExcel,
        exportCSV,

        ...importState,
    }
}