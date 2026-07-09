// @ts-nocheck
'use client'

import {
    useState
} from 'react'

import {

    exportResidentsToExcel,
    exportResidentsToCSV

} from '../services/resident-export-transform'

import { useResidentImport } from './useResidentImport'

export function useResidentActions(onImportSuccess) {

    /*
     |------------------------------------------------------------------
     | STATE
     |------------------------------------------------------------------
     */

    const [

        selectedResident,
        setSelectedResident

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
        resident
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
        resident
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