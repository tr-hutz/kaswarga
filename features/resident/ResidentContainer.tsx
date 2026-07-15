'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useDataTable }       from '@/hooks/useDataTable'
import { useResidentData }    from './hooks/useResidentData'
import { useResidentActions } from './hooks/useResidentActions'
import { useAuth }            from '@/lib/auth/useAuth'
import { supabase }           from '@/lib/supabase'
import { deleteResident }     from '@/lib/services/resident.service'
import { useToast }           from '@/components/ui/ToastProvider'
import ResidentView           from './ResidentView'
import type { Database }      from '@/types/database'

type ResidentRow = Database['public']['Tables']['residents']['Row']

function toFormShape(row: ResidentRow) {
    return { ...row, houseNumber: row.house_number }
}

export default function ResidentContainer() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { membership } = (useAuth() as any) ?? {}
    const rtId = membership?.rt?.id as string | undefined
    const t = useTranslations('residents')

    // Query state in URL
    const { query, setPage, setPageSize, setSearch, setSort, setFilter } = useDataTable({ sortBy: 'name' })

    // Paginated list
    const { result, loading, error, reload } = useResidentData(query)

    // Pending registration requests
    const [pendingRequests, setPendingRequests] = useState<unknown[]>([])
    const [pendingLoading,  setPendingLoading]  = useState(true)

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
            const { data, error: e } = await supabase
                .from('registration_requests')
                .select('*')
                .eq('type', 'resident')
                .eq('status', 'pending')
                .eq('rt_id', rtId)
                .order('created_at', { ascending: false })
            if (e) throw e
            setPendingRequests(data ?? [])
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: importError, ...actions } = useResidentActions((inserted: number) => {
        refresh()
        toast({ message: `${inserted} residents imported successfully.`, type: 'success' })
    }) as any

    function handleRowClick(row: ResidentRow) {
        actions.openDrawer(toFormShape(row))
    }

    function handleEdit(row: ResidentRow) {
        actions.openEditForm(toFormShape(row))
    }

    async function handleDelete(row: ResidentRow) {
        if (!confirm(t('row.deactivateConfirm'))) return
        try {
            await deleteResident(row.id)
            refresh()
        } catch (err) {
            console.error('[WARGA] delete:', err)
            alert(t('row.deleteFailed'))
        }
    }

    return (
        <ResidentView
            result={result}
            loading={loading}
            error={error}
            reload={reload}
            pendingRequests={pendingRequests}
            pendingLoading={pendingLoading}
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
    )
}
