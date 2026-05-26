'use client'

import {
    useState
} from 'react'

import {

    createPengeluaran,
    updatePengeluaran,
    deletePengeluaran

} from '../../../lib/services/pengeluaran.service'

import {

    exportPengeluaranCSV,
    exportPengeluaranExcel

} from '../services/pengeluaran-export-transform'

export function usePengeluaranActions({

                                          onReload

                                      }) {

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

    const [
        formOpen,
        setFormOpen
    ] = useState(false)

    const [
        submitting,
        setSubmitting
    ] = useState(false)

    /*
     |-------------------------------------------------------------
     | DRAWER
     |-------------------------------------------------------------
     */

    function openDrawer(
        row
    ) {

        setSelectedRow(row)

        setDrawerOpen(true)
    }

    function closeDrawer() {

        setDrawerOpen(false)

        setSelectedRow(null)
    }

    /*
     |-------------------------------------------------------------
     | FORM
     |-------------------------------------------------------------
     */

    function openCreateForm() {

        setSelectedRow(null)

        setFormOpen(true)
    }

    function openEditForm(
        row
    ) {

        setSelectedRow(row)

        setFormOpen(true)
    }

    function closeForm() {

        setFormOpen(false)

        setSelectedRow(null)
    }

    /*
     |-------------------------------------------------------------
     | CREATE / UPDATE
     |-------------------------------------------------------------
     */

    async function submitForm(
        payload
    ) {

        try {

            setSubmitting(true)

            /*
             |---------------------------------------------------------
             | CREATE
             |---------------------------------------------------------
             */

            if (!selectedRow) {

                await createPengeluaran(
                    payload
                )

            } else {

                /*
                 |-------------------------------------------------------
                 | UPDATE
                 |-------------------------------------------------------
                 */

                await updatePengeluaran(

                    selectedRow.id,
                    payload

                )
            }

            closeForm()

            await onReload?.()

        } catch (err) {

            console.error(
                '[PENGELUARAN SUBMIT]',
                err
            )

            alert(
                'Gagal menyimpan data'
            )

        } finally {

            setSubmitting(false)
        }
    }

    /*
     |-------------------------------------------------------------
     | DELETE
     |-------------------------------------------------------------
     */

    async function removeRow(
        row
    ) {

        const confirmed =
            confirm(
                `Hapus pengeluaran "${row.deskripsi}" ?`
            )

        if (!confirmed) {
            return
        }

        try {

            await deletePengeluaran(
                row.id
            )

            await onReload?.()

        } catch (err) {

            console.error(
                '[DELETE PENGELUARAN]',
                err
            )

            alert(
                'Gagal menghapus data'
            )
        }
    }

    /*
     |-------------------------------------------------------------
     | EXPORT
     |-------------------------------------------------------------
     */

    async function exportCSV(
        rows
    ) {

        await exportPengeluaranCSV(
            rows
        )
    }

    async function exportExcel(
        rows
    ) {

        await exportPengeluaranExcel(
            rows
        )
    }

    /*
     |-------------------------------------------------------------
     | RETURN
     |-------------------------------------------------------------
     */

    return {

        /*
         * state
         */

        selectedRow,

        drawerOpen,

        formOpen,

        submitting,

        /*
         * drawer
         */

        openDrawer,

        closeDrawer,

        /*
         * form
         */

        openCreateForm,

        openEditForm,

        closeForm,

        submitForm,

        /*
         * delete
         */

        removeRow,

        /*
         * export
         */

        exportCSV,

        exportExcel
    }
}