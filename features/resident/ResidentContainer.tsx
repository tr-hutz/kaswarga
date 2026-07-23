'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useDataTable }       from '@/hooks/useDataTable'
import { useResidentData }    from './hooks/useResidentData'
import { useResidentActions } from './hooks/useResidentActions'
import { useAuth }            from '@/lib/auth/useAuth'
import { hasPermission }      from '@/lib/permissions/permissions'
import { PERMISSIONS }        from '@/lib/permissions/permission-constants'
import { supabase }           from '@/lib/supabase'
import { findPendingResidentRegistrations } from '@/lib/repositories/registration.repository'
import { deleteResident }     from '@/lib/services/resident.service'
import { useToast }           from '@/components/ui/ToastProvider'
import ConfirmDialog          from '@/components/ui/ConfirmDialog'
import ResidentView           from './ResidentView'
import type { Database }      from '@/types/database'

type ResidentRow = Database['public']['Tables']['residents']['Row']

function toFormShape(row: ResidentRow) {
    return { ...row, houseNumber: row.house_number }
}

export default function ResidentContainer() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { membership, role } = (useAuth() as any) ?? {}
    const rtId = membership?.rt?.id as string | undefined
    const currentResidentId = membership?.resident?.id as string | undefined
    const canManage = hasPermission(role, PERMISSIONS.MANAGE_RESIDENTS)
    const t = useTranslations('residents')
    const tc = useTranslations('common')

    // Query state in URL
    const { query, setPage, setPageSize, setSearch, setSort, setFilter } = useDataTable({ sortBy: 'name' }, 'residents')

    // Paginated list
    const { result, loading, error, reload } = useResidentData(query)

    // Pending registration requests
    const [pendingRequests, setPendingRequests] = useState<unknown[]>([])
    const [pendingLoading,  setPendingLoading]  = useState(true)

    // Delete confirmation
    const [deleteTarget,  setDeleteTarget]  = useState<ResidentRow | null>(null)
    const [deleting,      setDeleting]      = useState(false)

    useEffect(() => {
        if (rtId) loadPending()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rtId])

    useEffect(() => {
        if (!rtId) return
        const channel = supabase
            .channel('resident-pending-requests')
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'registration_requests',
                filter: 'type=eq.resident',
            }, () => loadPending())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rtId])

    async function loadPending() {
        if (!rtId) return
        setPendingLoading(true)
        try {
            const data = await findPendingResidentRegistrations(rtId)
            setPendingRequests(data)
        } catch (err) {
            console.error('[WARGA] pending:', err)
        } finally {
            setPendingLoading(false)
        }
    }

    function refresh() { reload(); loadPending() }

    // Drawer / form / export / import
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { toast } = (useToast() as any) ?? {}
    const { error: importError, ...actions } = useResidentActions((inserted: number) => {
        refresh()
        toast({ message: `${inserted} residents imported successfully.`, type: 'success' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any

    function handleRowClick(row: ResidentRow) {
        actions.openDrawer(toFormShape(row))
    }

    function handleEdit(row: ResidentRow) {
        actions.openEditForm(toFormShape(row))
    }

    function handleDelete(row: ResidentRow) {
        setDeleteTarget(row)
    }

    async function confirmDelete() {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await deleteResident(deleteTarget.id)
            refresh()
        } catch (err) {
            console.error('[WARGA] delete:', err)
            toast({ message: t('row.deleteFailed'), type: 'error' })
        } finally {
            setDeleting(false)
            setDeleteTarget(null)
        }
    }

    return (
        <>
            <ResidentView
                result={result}
                loading={loading}
                error={error}
                reload={reload}
                pendingRequests={pendingRequests}
                pendingLoading={pendingLoading}
                canManage={canManage}
                role={role ?? ''}
                currentResidentId={currentResidentId}
                query={query}
                setPage={setPage}
                setPageSize={setPageSize}
                setSearch={setSearch}
                setSort={setSort}
                setFilter={setFilter}
                onRowClick={handleRowClick}
                onEdit={handleEdit}
                onDelete={handleDelete}
                refresh={refresh}
                importError={importError}
                {...actions}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                title={t('row.deactivateTitle')}
                message={t('row.deactivateConfirm')}
                confirmLabel={tc('actions.delete')}
                cancelLabel={tc('actions.cancel')}
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </>
    )
}
