'use client'

import React                from 'react'
import { useTranslations }  from 'next-intl'
import Icon                 from '@/components/ui/Icon'
import type {
    PermissionViewRow, ViewerFilter, ViewerSort, PermissionSource,
} from '../hooks/useEffectivePermission'

interface Props {
    rows:           PermissionViewRow[]
    expanded:       Set<string>
    filter:         ViewerFilter
    sort:           ViewerSort
    onToggleExpand: (id: string) => void
    onFilterChange: (f: ViewerFilter) => void
    onSortChange:   (s: ViewerSort) => void
}

const MODULE_LABELS: Record<string, string> = {
    resident:   'Warga',
    membership: 'Keanggotaan',
    payment:    'Pembayaran',
    expense:    'Pengeluaran',
    ledger:     'Buku Kas',
    report:     'Laporan',
    document:   'Dokumen',
    settings:   'Pengaturan',
    user:       'Pengguna',
    role:       'Role',
    permission: 'Izin',
    rbac:       'Otorisasi',
    audit:      'Audit',
    other:      'Lainnya',
}

function SourceBadge({ source }: { source: PermissionSource }) {
    const t = useTranslations('viewer')
    switch (source) {
        case 'override_grant':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                    <Icon name="check" size={10} />
                    {t('source.override_grant')}
                </span>
            )
        case 'override_revoke':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger">
                    <Icon name="x" size={10} />
                    {t('source.override_revoke')}
                </span>
            )
        case 'role':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    <Icon name="shield" size={10} />
                    {t('source.role')}
                </span>
            )
        default:
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-canvas text-muted">
                    {t('source.none')}
                </span>
            )
    }
}

const FILTERS: { value: ViewerFilter; labelKey: string }[] = [
    { value: 'all',      labelKey: 'filter.all' },
    { value: 'granted',  labelKey: 'filter.granted' },
    { value: 'denied',   labelKey: 'filter.denied' },
    { value: 'override', labelKey: 'filter.overrideOnly' },
    { value: 'role',     labelKey: 'filter.roleOnly' },
]

const SORTS: { value: ViewerSort; labelKey: string }[] = [
    { value: 'module',    labelKey: 'sort.module' },
    { value: 'name',      labelKey: 'sort.name' },
    { value: 'effective', labelKey: 'sort.effective' },
]

export default function PermissionDetailTable({
    rows, expanded, filter, sort,
    onToggleExpand, onFilterChange, onSortChange,
}: Props) {
    const t  = useTranslations('viewer')
    const tc = useTranslations('common')

    return (
        <div className="space-y-3">
            {/* Filter + Sort bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                    {FILTERS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => onFilterChange(f.value)}
                            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                                filter === f.value
                                    ? 'bg-primary text-white border-primary'
                                    : 'border-divider text-muted hover:border-foreground hover:text-foreground'
                            }`}
                        >
                            {t(f.labelKey as Parameters<typeof t>[0])}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">{t('sortBy')}</span>
                    {SORTS.map(s => (
                        <button
                            key={s.value}
                            onClick={() => onSortChange(s.value)}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                                sort === s.value
                                    ? 'bg-canvas border-primary text-primary font-medium'
                                    : 'border-divider text-muted hover:border-foreground hover:text-foreground'
                            }`}
                        >
                            {t(s.labelKey as Parameters<typeof t>[0])}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-divider bg-surface">
                {rows.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted">{tc('status.empty')}</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-divider bg-canvas">
                                <th className="w-6 px-3 py-3" />
                                <th className="px-4 py-3 text-left font-semibold text-foreground min-w-[200px]">{t('table.permission')}</th>
                                <th className="px-4 py-3 text-left font-semibold text-foreground w-[130px]">{t('table.module')}</th>
                                <th className="px-4 py-3 text-left font-semibold text-foreground w-[160px]">{t('table.source')}</th>
                                <th className="px-4 py-3 text-center font-semibold text-foreground w-[100px]">{t('table.effective')}</th>
                                <th className="px-4 py-3 text-left font-semibold text-foreground">{t('table.reason')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.flatMap(row => {
                                const isExpanded = expanded.has(row.id)
                                const items: React.ReactNode[] = [
                                    <tr
                                        key={row.id}
                                        className="border-b border-divider hover:bg-canvas/40 transition-colors cursor-pointer"
                                        onClick={() => onToggleExpand(row.id)}
                                    >
                                        <td className="px-3 py-3 text-muted">
                                            <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size={14} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-foreground">{row.name}</p>
                                            <p className="text-xs text-muted font-mono">{row.code}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-muted">
                                                {MODULE_LABELS[row.module] ?? row.module}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <SourceBadge source={row.source} />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {row.effective
                                                ? <span className="text-success"><Icon name="check-circle" size={16} /></span>
                                                : <span className="text-danger"><Icon name="x-circle" size={16} /></span>
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted">{row.reason}</td>
                                    </tr>,
                                ]
                                if (isExpanded) {
                                    items.push(
                                        <tr key={`${row.id}-detail`} className="bg-canvas/60 border-b border-divider">
                                            <td />
                                            <td colSpan={5} className="px-6 py-3">
                                                <div className="grid grid-cols-3 gap-4 text-xs">
                                                    <div>
                                                        <p className="font-semibold text-foreground mb-0.5">{t('detail.role')}</p>
                                                        <p>
                                                            {row.roleAllow === true
                                                                ? <span className="text-success">{t('detail.granted')}</span>
                                                                : <span className="text-muted">{t('detail.notAssigned')}</span>
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground mb-0.5">{t('detail.override')}</p>
                                                        <p>
                                                            {row.overrideAllow === true
                                                                ? <span className="text-success">{t('detail.grant')}</span>
                                                                : row.overrideAllow === false
                                                                    ? <span className="text-danger">{t('detail.revoke')}</span>
                                                                    : <span className="text-muted">{t('detail.none')}</span>
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground mb-0.5">{t('detail.finalDecision')}</p>
                                                        <p>
                                                            {row.effective
                                                                ? <span className="text-success font-medium">{t('detail.granted')}</span>
                                                                : <span className="text-danger font-medium">{t('detail.denied')}</span>
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                                {row.description && (
                                                    <p className="mt-2 text-xs text-muted italic">{row.description}</p>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                }
                                return items
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
