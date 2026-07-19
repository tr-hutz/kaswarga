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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [deleteTarget, setDeleteTarget] = useState<any>(null)

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

    function removeRow(row: any) {
        setDeleteTarget(row)
    }

    async function confirmDelete() {
        if (!deleteTarget) return
        try {
            await deleteExpense(deleteTarget.id)
            await onReload?.()
        } catch (err) {
            console.error('[DELETE PENGELUARAN]', err)
        } finally {
            setDeleteTarget(null)
        }
    }

    function cancelDelete() {
        setDeleteTarget(null)
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
        deleteTarget,
        confirmDelete,
        cancelDelete,

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