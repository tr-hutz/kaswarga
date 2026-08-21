'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo }           from 'react'
import { useTranslations }   from 'next-intl'
import { useDataTable }      from '@/lib/hooks/useDataTable'
import { useIncomeData }     from './hooks/useIncomeData'
import { useIncomeRealtime } from './hooks/useIncomeRealtime'
import { useIncomeActions }  from './hooks/useIncomeActions'
import { buildIncomeColumns } from './components/IncomeColumns'
import IncomeView            from './IncomeView'

export default function IncomeContainer() {
    const t  = useTranslations('income')
    const tc = useTranslations('common')

    const { query, setPage, setPageSize, setSearch, setFilter } =
        useDataTable({}, 'income')

    const { result, loading, error, reload } = useIncomeData(query)
    useIncomeRealtime({ onReload: reload })

    const { error: importError, ...actions } = useIncomeActions({
        onReload:          reload,
        onApprovalSuccess: reload,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any

    const columns = useMemo(
        () => buildIncomeColumns({
            t:        k => t(k as any),
            tc:       k => tc(k as any),
            onView:   actions.openDrawer,
            onEdit:   actions.openEditForm,
            onDelete: actions.removeRow,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    )

    return (
        <IncomeView
            result={result}
            columns={columns}
            loading={loading}
            error={error}
            onRetry={reload}
            query={query}
            setPage={setPage}
            setPageSize={setPageSize}
            setSearch={setSearch}
            setFilter={setFilter}
            importError={importError ?? ''}
            {...actions}
        />
    )
}
