'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState }          from 'react'
import { createIncome, updateIncomeById, deleteIncomeById } from '@/lib/services/income.service'
import { useIncomeApproval } from './useIncomeApproval'
import { useIncomeImport }   from './useIncomeImport'
import { exportIncomeToExcel } from '@/features/income/services/income-export-transform'
import { exportFileName }      from '@/lib/export/export-utils'
import { useToast }          from '@/components/ui/ToastProvider'
import { useAuth }           from '@/lib/auth/useAuth'
import { logActivity }       from '@/lib/services/activity-logger'

export function useIncomeActions({
    onReload,
    onApprovalSuccess,
}: {
    onReload?:          () => void
    onApprovalSuccess?: () => void
} = {}) {

    const { toast }      = useToast()
    const { membership } = useAuth()

    const [selectedRow,  setSelectedRow]  = useState<any>(null)
    const [drawerOpen,   setDrawerOpen]   = useState(false)
    const [formOpen,     setFormOpen]     = useState(false)
    const [submitting,   setSubmitting]   = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<any>(null)
    const [deleting,     setDeleting]     = useState(false)

    /* ------------------------------------------------------------------ */
    /* Drawer                                                               */
    /* ------------------------------------------------------------------ */

    function openDrawer(row: any) {
        setSelectedRow(row)
        setDrawerOpen(true)
    }

    function closeDrawer() {
        setDrawerOpen(false)
        setSelectedRow(null)
    }

    /* ------------------------------------------------------------------ */
    /* Form                                                                 */
    /* ------------------------------------------------------------------ */

    function openCreateForm() {
        setSelectedRow(null)
        setFormOpen(true)
    }

    function openEditForm(row: any) {
        setSelectedRow(row)
        setFormOpen(true)
    }

    function closeForm() {
        setFormOpen(false)
        setSelectedRow(null)
    }

    async function submitForm(payload: any) {
        setSubmitting(true)
        try {
            if (!selectedRow) {
                await createIncome(payload)
                toast({ message: 'Pemasukan berhasil dicatat.', type: 'success' })
            } else {
                await updateIncomeById(selectedRow.id, payload)
                toast({ message: 'Pemasukan berhasil diperbarui.', type: 'success' })
            }
            closeForm()
            await onReload?.()
        } catch (err) {
            console.error('[INCOME SUBMIT]', err)
            throw err
        } finally {
            setSubmitting(false)
        }
    }

    /* ------------------------------------------------------------------ */
    /* Delete                                                               */
    /* ------------------------------------------------------------------ */

    function removeRow(row: any) {
        setDeleteTarget(row)
    }

    async function confirmDelete() {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await deleteIncomeById(deleteTarget.id)
            await onReload?.()
        } catch (err) {
            console.error('[DELETE INCOME]', err)
        } finally {
            setDeleteTarget(null)
            setDeleting(false)
        }
    }

    function cancelDelete() {
        setDeleteTarget(null)
    }

    /* ------------------------------------------------------------------ */
    /* Approval                                                             */
    /* ------------------------------------------------------------------ */

    /* ------------------------------------------------------------------ */
    /* Export                                                               */
    /* ------------------------------------------------------------------ */

    async function exportExcel(rows: any[]) {
        const rtCode   = membership?.rt?.code ?? undefined
        const fileName = exportFileName(membership?.rt?.name ?? 'RT', 'pemasukan')
        await exportIncomeToExcel(rows, rtCode, fileName)
        logActivity({
            rtId:        membership?.rt?.id,
            actorId:     membership?.user?.id,
            actorName:   membership?.user?.name,
            action:      'EXPORT',
            entityType:  'income_transactions',
            description: `${membership?.user?.name ?? 'Pengguna'} mengekspor data pemasukan`,
        })
        if (process.env.NODE_ENV === 'production' && rtCode) {
            toast({ message: 'File dilindungi password. Gunakan kode RT untuk membuka.', type: 'success' })
        }
    }

    /* ------------------------------------------------------------------ */
    /* Import                                                               */
    /* ------------------------------------------------------------------ */

    const { rows: importRows, ...restImport } = useIncomeImport()

    /* ------------------------------------------------------------------ */
    /* Approval                                                             */
    /* ------------------------------------------------------------------ */

    const { loading: approvalLoading, approve: approveIncome, reject: rejectIncome, approveAll } =
        useIncomeApproval({
            onSuccess: () => {
                closeDrawer()
                onReload?.()
                onApprovalSuccess?.()
            },
        })

    /* ------------------------------------------------------------------ */
    /* Return                                                               */
    /* ------------------------------------------------------------------ */

    return {
        selectedRow,
        drawerOpen,
        formOpen,
        submitting,
        deleteTarget,
        deleting,
        openDrawer,
        closeDrawer,
        openCreateForm,
        openEditForm,
        closeForm,
        submitForm,
        removeRow,
        confirmDelete,
        cancelDelete,
        exportExcel,
        importRows,
        ...restImport,
        approvalLoading,
        approveIncome,
        rejectIncome,
        approveAll,
    }
}
