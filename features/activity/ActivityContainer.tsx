'use client'

import ActivityView            from './ActivityView'
import { useDataTable }        from '@/lib/hooks/useDataTable'
import { useActivityData }     from './hooks/useActivityData'
import { useActivityRealtime } from './hooks/useActivityRealtime'
import { useAuth }             from '@/lib/auth/useAuth'

export default function ActivityContainer() {
    const { query, setPage, setPageSize } = useDataTable({}, 'activity')
    const { membership } = useAuth()
    const isSuperAdmin = membership?.role === 'SUPER_ADMIN'

    const { result, stats, loading, error, reload } = useActivityData(query)
    useActivityRealtime({ onReload: reload })

    return (
        <ActivityView
            result={result}
            stats={stats}
            loading={loading}
            error={error}
            onRetry={reload}
            query={query}
            setPage={setPage}
            setPageSize={setPageSize}
            isSuperAdmin={isSuperAdmin}
        />
    )
}
