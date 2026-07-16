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

import { useExpenseImport }    from './useExpenseImport'
import { useExpenseApproval } from './useExpenseApproval'

export function useExpenseActions({

                                          onReload,
                                          onImportSuccess,
                                          onApprovalSuccess

                                      }: {
    onReload?:          () => void
    onImportSuccess?:   (inserted: number) => void
    onApprovalSuccess?: () => void
} = {}) {

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
        row: any
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
        row: any
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
        payload: any
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
                'Failed to save'
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
        row: any
    ) {

        const confirmed =
            confirm(
                `Delete expense "${row.description}"?`
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
                'Failed to delete'
            )
        }
    }

    /*
     |-------------------------------------------------------------
     | EXPORT
     |-------------------------------------------------------------
     */

    async function exportCSV(
        rows: any[]
    ) {

        await exportExpenseToCSV(
            rows as any
        )
    }

    async function exportExcel(
        rows: any[]
    ) {

        await exportExpenseToExcel(
            rows as any
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
        approve:    approveExpense,
        reject:     rejectExpense,
        approveAll: approveAllExpenses,
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
        approveExpense,
        rejectExpense,
        approveAllExpenses,
    }
}