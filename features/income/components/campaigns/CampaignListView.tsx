'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo }            from 'react'
import { useTranslations }    from 'next-intl'
import { useDataTable }       from '@/lib/hooks/useDataTable'
import { useCampaignData }    from '@/features/income/hooks/useCampaignData'
import { useCampaignActions } from '@/features/income/hooks/useCampaignActions'
import { DataTable }          from '@/components/common/data-table'
import Can                    from '@/components/ui/Can'
import Icon                   from '@/components/ui/Icon'
import { PERMISSION }         from '@/lib/auth/types'
import { usePermission }      from '@/lib/auth/usePermission'
import { formatRupiah }       from '@/lib/utils'
import CampaignDetailDrawer   from './CampaignDetailDrawer'
import CampaignForm           from './CampaignForm'

export default function CampaignListView() {
    const t = useTranslations('income.campaigns')

    const { query, setPage, setPageSize, setSearch, setFilter } =
        useDataTable({}, 'campaigns')

    const { result, loading, error, reload } = useCampaignData(query)

    const actions = useCampaignActions({ onReload: reload })

    const statusColors: Record<string, string> = {
        DRAFT:     'bg-muted/20 text-muted',
        ACTIVE:    'bg-success/10 text-success',
        COMPLETED: 'bg-primary/10 text-primary',
        CANCELLED: 'bg-danger/10 text-danger',
    }

    const canEdit = usePermission(PERMISSION.INCOME_CAMPAIGN_UPDATE)

    const columns = useMemo(() => [
        {
            key:    'name',
            title:  t('columns.name'),
            render: (row: any) => <span className="font-medium text-foreground">{row.name}</span>,
        },
        {
            key:    'status',
            title:  t('columns.status'),
            render: (row: any) => (
                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[row.status] ?? ''}`}>
                    {t(`status.${row.status}` as any)}
                </span>
            ),
        },
        {
            key:    'target_amount',
            title:  t('columns.target'),
            render: (row: any) => row.target_amount ? formatRupiah(row.target_amount) : <span className="text-muted">{t('detail.openEnded')}</span>,
        },
        {
            key:    'approved_amount',
            title:  t('columns.approved'),
            render: (row: any) => formatRupiah(row.approved_amount ?? 0),
        },
        ...(canEdit ? [{
            key:    'actions',
            title:  '',
            render: (row: any) => ['DRAFT', 'ACTIVE'].includes(row.status) ? (
                <button
                    onClick={e => { e.stopPropagation(); actions.openEditForm(row) }}
                    className="text-xs border border-divider rounded-lg px-3 py-1 hover:bg-canvas text-foreground"
                >
                    {t('actions.edit')}
                </button>
            ) : null,
        }] : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [canEdit])

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                result={result}
                loading={loading}
                error={error}
                query={query}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                onRetry={reload}
                onRowClick={actions.openDrawer}
                searchPlaceholder={t('searchPlaceholder')}
                onSearch={setSearch}
                renderFilters={
                    <select
                        value={String(query.filters?.status ?? 'all')}
                        onChange={e => setFilter('status', e.target.value)}
                        className="h-9 rounded-lg border border-divider bg-surface px-3 text-sm text-foreground"
                    >
                        <option value="all">{t('filters.allStatuses')}</option>
                        <option value="DRAFT">{t('status.DRAFT')}</option>
                        <option value="ACTIVE">{t('status.ACTIVE')}</option>
                        <option value="COMPLETED">{t('status.COMPLETED')}</option>
                        <option value="CANCELLED">{t('status.CANCELLED')}</option>
                    </select>
                }
                renderActions={
                    <Can permission={PERMISSION.INCOME_CAMPAIGN_CREATE}>
                        <button
                            onClick={actions.openCreateForm}
                            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg px-4 py-2 transition-colors"
                        >
                            <Icon name="plus" size={16} />
                            {t('addButton')}
                        </button>
                    </Can>
                }
            />

            <CampaignDetailDrawer
                open={actions.drawerOpen}
                campaign={actions.selectedCampaign}
                onClose={actions.closeDrawer}
                onActivate={actions.activateCampaign}
                onCancel={actions.cancelCampaign}
            />

            <CampaignForm
                open={actions.formOpen}
                onClose={actions.closeForm}
                onSubmit={actions.submitForm}
                initialData={actions.selectedCampaign}
            />
        </div>
    )
}
