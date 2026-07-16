'use client'

import {
    useState
} from 'react'

import {

    exportResidentsToExcel,
    exportResidentsToCSV

} from '../services/resident-export-transform'

import { useResidentImport } from './useResidentImport'

export function useResidentActions(onImportSuccess?: (inserted: number) => void) {

    /*
     |------------------------------------------------------------------
     | STATE
     |------------------------------------------------------------------
     */

    const [

        selectedResident,
        setSelectedResident

    ] = useState<any>(null)

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
        resident: any
    ) {

        setSelectedResident(
            resident
        )

        setDrawerOpen(true)
    }

    function closeDrawer() {

        setDrawerOpen(false)

        setSelectedResident(null)
    }

    /*
     |------------------------------------------------------------------
     | FORM
     |------------------------------------------------------------------
     */

    function openCreateForm() {

        setSelectedResident(null)

        setFormOpen(true)
    }

    function openEditForm(
        resident: any
    ) {

        setSelectedResident(
            resident
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

    async function exportExcel(data: any[]) {
        await exportResidentsToExcel(data as any)
    }

    async function exportCSV(data: any[]) {
        await exportResidentsToCSV(data as any)
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

        selectedResident,

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