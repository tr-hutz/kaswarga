'use client'

import {
    useState
} from 'react'

import {

    exportResidentsToExcel,
    exportResidentsToCSV

} from '../services/warga-export-transform'

import { useResidentImport } from './useWargaImport'

export function useResidentActions(onImportSuccess) {

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
        await exportResidentsToExcel(data)
    }

    async function exportCSV(data) {
        await exportResidentsToCSV(data)
    }

    /*
     |------------------------------------------------------------------
     | IMPORT
     |------------------------------------------------------------------
     */

    const importState = useResidentImport(onImportSuccess)

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