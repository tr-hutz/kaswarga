'use client'

import { useMemo, useState }  from 'react'
import { useTranslations }    from 'next-intl'
import { DataTable }          from '@/components/common/data-table'
import ActivityAnalytics      from './components/analytics/ActivityAnalytics'
import ActivityDrawer         from './components/drawer/ActivityDrawer'
import { buildActivityColumns } from './components/ActivityColumns'
import type { QueryOptions, PageResult } from '@/lib/types/query'
import type { MappedActivity, ActivityStats } from './hooks/useActivityData'

interface Props {
    result:    PageResult<MappedActivity> | null
    stats:     ActivityStats
    loading:   boolean
    error:     boolean
    onRetry:   () => void
    query:     QueryOptions
    setPage:       (p: number) => void
    setPageSize:   (s: number) => void
}

export default function ActivityView({
    result, stats, loading, error, onRetry,
    query, setPage, setPageSize,
}: Props) {
    const t = useTranslations('activity')

    const [selectedRow, setSelectedRow] = useState<MappedActivity | null>(null)
    const [drawerOpen,  setDrawerOpen]  = useState(false)

    function openDrawer(row: MappedActivity) {
        setSelectedRow(row)
        setDrawerOpen(true)
    }

    function closeDrawer() {
        setDrawerOpen(false)
        setSelectedRow(null)
    }

    const columns = useMemo(
        () => buildActivityColumns({ t: (k) => t(k as Parameters<typeof t>[0]) }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    )

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-slate-500">{t('subtitle')}</p>
            </div>

            <ActivityAnalytics
                total={stats.total}
                approvals={stats.approvals}
                expenseCount={stats.expenseCount}
                residentCount={stats.residentCount}
            />

            <DataTable
                columns={columns}
                result={result}
                loading={loading}
                error={error}
                query={query}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                onRetry={onRetry}
                onRowClick={openDrawer}
            />

            <ActivityDrawer open={drawerOpen} row={selectedRow} onClose={closeDrawer} />
        </div>
    )
}
