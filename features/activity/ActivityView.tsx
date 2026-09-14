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
    result:       PageResult<MappedActivity> | null
    stats:        ActivityStats
    loading:      boolean
    error:        boolean
    onRetry:      () => void
    query:        QueryOptions
    setPage:      (p: number) => void
    setPageSize:  (s: number) => void
    setSearch:    (s: string) => void
    setFilter:    (key: string, value: unknown) => void
    isSuperAdmin: boolean
}

export default function ActivityView({
    result, stats, loading, error, onRetry,
    query, setPage, setPageSize, setSearch, setFilter, isSuperAdmin,
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
                <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                <p className="text-sm text-muted mt-1">{t('subtitle')}</p>
            </div>

            <ActivityAnalytics
                total={stats.total}
                paymentApprovals={stats.paymentApprovals}
                paymentRejections={stats.paymentRejections}
                expenseApprovals={stats.expenseApprovals}
                expenseRejections={stats.expenseRejections}
                residentCount={stats.residentCount}
                showDetails={!isSuperAdmin}
            />

            <DataTable
                columns={columns}
                result={result}
                loading={loading}
                error={error}
                query={query}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                onSearch={setSearch}
                searchPlaceholder={t('searchPlaceholder')}
                onRetry={onRetry}
                onRowClick={openDrawer}
                renderFilters={
                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            value={String(query.filters?.action ?? 'all')}
                            onChange={(e) => setFilter('action', e.target.value)}
                            className="h-9 rounded-lg border border-divider bg-surface px-3 text-sm text-foreground"
                        >
                            <option value="all">{t('filters.allActions')}</option>
                            <option value="CREATE">{t('filters.create')}</option>
                            <option value="UPDATE">{t('filters.update')}</option>
                            <option value="DELETE">{t('filters.delete')}</option>
                            <option value="APPROVE">{t('filters.approve')}</option>
                            <option value="REJECT">{t('filters.reject')}</option>
                            <option value="SUBMIT">{t('filters.submit')}</option>
                        </select>
                        <select
                            value={String(query.filters?.entity_type ?? 'all')}
                            onChange={(e) => setFilter('entity_type', e.target.value)}
                            className="h-9 rounded-lg border border-divider bg-surface px-3 text-sm text-foreground"
                        >
                            <option value="all">{t('filters.allEntities')}</option>
                            <option value="income_transactions">{t('entities.income_transactions')}</option>
                            <option value="expense">{t('entities.expense')}</option>
                            <option value="payment">{t('entities.payment')}</option>
                            <option value="residents">{t('entities.residents')}</option>
                            <option value="donation">{t('entities.donation')}</option>
                            <option value="rt">{t('entities.rt')}</option>
                            <option value="auth">{t('entities.auth')}</option>
                            <option value="user">{t('entities.user')}</option>
                        </select>
                    </div>
                }
            />

            <ActivityDrawer open={drawerOpen} row={selectedRow} onClose={closeDrawer} />
        </div>
    )
}
