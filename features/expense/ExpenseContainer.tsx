'use client'

import ExpenseView              from './ExpenseView'
import { useDataTable }         from '@/lib/hooks/useDataTable'
import { useExpenseData }       from './hooks/useExpenseData'
import { useExpenseRealtime }   from './hooks/useExpenseRealtime'
import { useExpenseActions }    from './hooks/useExpenseActions'
import { useExpenseCategories } from './hooks/useExpenseCategory'

export default function ExpenseContainer() {
    const { query, setPage, setPageSize, setSearch, setSort, setFilter } =
        useDataTable({}, 'expenses')

    const { result, loading, error: fetchError, reload } = useExpenseData(query)
    useExpenseRealtime({ onReload: reload })

    const { categories } = useExpenseCategories()

    const { error: importError, ...actions } = useExpenseActions({
        onReload:          reload,
        onApprovalSuccess: () => { reload() },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any

    return (
        <ExpenseView
            result={result}
            loading={loading}
            fetchError={fetchError}
            onRetry={reload}
            categories={categories}
            query={query}
            setPage={setPage}
            setPageSize={setPageSize}
            setSearch={setSearch}
            setSort={setSort}
            setFilter={setFilter}
            importError={importError}
            onApproved={reload}
            {...actions}
        />
    )
}
