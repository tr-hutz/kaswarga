// @ts-nocheck
'use client'

import {
    useState
} from 'react'

import {

    createExpense,
    updateExpense,
    deleteExpense

} from '../../../lib/services/expense.service'

import {

    exportExpenseToCSV,
    exportExpenseToExcel

} from '../services/expense-export-transform'

import { useExpenseImport }    from './usePengeluaranImport'
import { useExpenseApproval } from './useApprovalPengeluaran'

export function useExpenseActions({

                                          onReload,
                                          onImportSuccess,
                                          onApprovalSuccess

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

                await createExpense(
                    payload
                )

            } else {

                /*
                 |-------------------------------------------------------
                 | UPDATE
                 |-------------------------------------------------------
                 */

                await updateExpense(

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

            await deleteExpense(
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

        await exportExpenseToCSV(
            rows
        )
    }

    async function exportExcel(
        rows
    ) {

        await exportExpenseToExcel(
            rows
        )
    }

    /*
     |-------------------------------------------------------------
     | IMPORT
     |-------------------------------------------------------------
     */

    const {
        rows:      importRows,
        ...restImport
    } = useExpenseImport(onImportSuccess)

    /*
     |-------------------------------------------------------------
     | APPROVAL
     |-------------------------------------------------------------
     */

    const {
        loading:    approvalLoading,
        approve:    approvePengeluaran,
        reject:     rejectPengeluaran,
        approveAll: approveAllPengeluaran,
    } = useExpenseApproval({
        onSuccess: () => {
            closeDrawer()
            onReload?.()
            onApprovalSuccess?.()
        }
    })

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

        exportExcel,

        /*
         * import
         */

        importRows,
        ...restImport,

        /*
         * approval
         */

        approvalLoading,
        approvePengeluaran,
        rejectPengeluaran,
        approveAllPengeluaran,
    }
}