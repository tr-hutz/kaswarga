'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
    useState
} from 'react'

import {

    createExpense,
    updateExpense,
    deleteExpense

} from '@/lib/services/expense.service'

import { exportExpenseToExcel } from '@/features/expense/services/expense-export-transform'
import { exportFileName }       from '@/lib/export/export-utils'
import { useExpenseImport }     from './useExpenseImport'
import { useExpenseApproval }  from './useExpenseApproval'
import { useAuth }             from '@/lib/auth/useAuth'
import { useToast }            from '@/components/ui/ToastProvider'
import { logActivity }         from '@/lib/services/activity-logger'

export function useExpenseActions({

                                          onReload,
                                          onApprovalSuccess

                                      }: {
    onReload?:          () => void
    onApprovalSuccess?: () => void
} = {}) {

    const { membership } = useAuth()
    const { toast }      = useToast()

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

    async function exportExcel(rows: any[]) {
        const rtCode   = membership?.rt?.code ?? undefined
        const fileName = exportFileName(membership?.rt?.name ?? 'RT', 'pengeluaran')
        await exportExpenseToExcel(rows as any, rtCode, fileName)
        logActivity({
            rtId:        membership?.rt?.id,
            actorId:     membership?.user?.id,
            actorName:   membership?.user?.name,
            action:      'EXPORT',
            entityType:  'expenses',
            description: `${membership?.user?.name ?? 'Pengguna'} mengekspor data pengeluaran`,
        })
        if (process.env.NODE_ENV === 'production' && rtCode) {
            toast({ message: 'File dilindungi password. Gunakan kode RT untuk membuka.', type: 'success' })
        }
    }

    /*
     |-------------------------------------------------------------
     | IMPORT
     |-------------------------------------------------------------
     */

    const {
        rows:      importRows,
        ...restImport
    } = useExpenseImport()

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