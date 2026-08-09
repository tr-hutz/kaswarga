'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState }          from 'react'
import { createIncome, updateIncomeById, deleteIncomeById } from '@/lib/services/income.service'
import { useIncomeApproval } from './useIncomeApproval'
import { useIncomeImport }   from './useIncomeImport'
import { exportIncomeToCSV, exportIncomeToExcel } from '../services/income-export-transform'

export function useIncomeActions({
    onReload,
    onApprovalSuccess,
}: {
    onReload?:          () => void
    onApprovalSuccess?: () => void
} = {}) {

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
            } else {
                await updateIncomeById(selectedRow.id, payload)
            }
            closeForm()
            await onReload?.()
        } catch (err) {
            console.error('[INCOME SUBMIT]', err)
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

    async function exportCSV(rows: any[]) {
        await exportIncomeToCSV(rows)
    }

    async function exportExcel(rows: any[]) {
        await exportIncomeToExcel(rows)
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
        exportCSV,
        exportExcel,
        importRows,
        ...restImport,
        approvalLoading,
        approveIncome,
        rejectIncome,
        approveAll,
    }
}
