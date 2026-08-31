'use client'

import { useState }                from 'react'
import { useTranslations }          from 'next-intl'
import Input                        from '@/components/ui/Input'
import Ribbon                     from '@/components/ui/Ribbon'
import PermissionDetailTable        from '@/features/authorization/viewer/components/PermissionDetailTable'
import type { MemberDetailData }    from '../hooks/usePermissionInspector'
import type {
    ViewerFilter,
    ViewerSort,
} from '@/features/authorization/viewer/hooks/useEffectivePermission'

const ROLE_LABELS: Record<string, string> = {
    ADMIN:     'Administrator',
    CHAIR:     'Ketua',
    TREASURER: 'Bendahara',
    SECRETARY: 'Sekretaris',
    RESIDENT:  'Warga',
}

interface Props { detail: MemberDetailData }

export default function MemberDetailPanel({ detail }: Props) {
    const t  = useTranslations('inspector')
    const tc = useTranslations('common')

    const [search,   setSearch]   = useState('')
    const [filter,   setFilter]   = useState<ViewerFilter>('all')
    const [sort,     setSort]     = useState<ViewerSort>('module')
    const [expanded, setExpanded] = useState<Set<string>>(new Set())

    function toggleExpanded(id: string) {
        setExpanded(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id); else next.add(id)
            return next
        })
    }

    const filteredRows = detail.permissions
        .filter(r => {
            switch (filter) {
                case 'granted':  if (!r.effective)            return false; break
                case 'denied':   if (r.effective)              return false; break
                case 'override': if (r.overrideAllow === null) return false; break
                case 'role':     if (r.overrideAllow !== null || r.roleAllow !== true) return false; break
            }
            if (!search.trim()) return true
            const q = search.toLowerCase()
            return r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)
        })
        .sort((a, b) => {
            if (sort === 'name')      return a.name.localeCompare(b.name)
            if (sort === 'effective') return (b.effective ? 1 : 0) - (a.effective ? 1 : 0) || a.name.localeCompare(b.name)
            return a.module.localeCompare(b.module) || a.name.localeCompare(b.name)
        })

    return (
        <div className="space-y-4">
            {/* Member header */}
            <div className="rounded-xl border border-divider bg-surface p-4">
                <div className="flex flex-wrap gap-6">
                    <div>
                        <p className="text-xs text-muted uppercase tracking-wider">{t('member.name')}</p>
                        <p className="font-semibold text-foreground">{detail.name ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted uppercase tracking-wider">{t('member.role')}</p>
                        <p className="font-medium text-foreground">
                            {detail.roleName || ROLE_LABELS[detail.roleCode] || detail.roleCode}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted uppercase tracking-wider">{t('member.status')}</p>
                        <Ribbon
                            label={detail.status === 'active' ? tc('status.active') : tc('status.inactive')}
                            status={detail.status === 'active' ? 'active' : 'inactive'}
                            variant="rounded"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-divider text-center">
                    <div>
                        <p className="text-xl font-bold text-foreground">{detail.summary.total}</p>
                        <p className="text-xs text-muted">Total</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-success">{detail.summary.granted}</p>
                        <p className="text-xs text-muted">{t('stats.granted')}</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-danger">{detail.summary.denied}</p>
                        <p className="text-xs text-muted">{t('stats.denied')}</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-warning">{detail.summary.overrides}</p>
                        <p className="text-xs text-muted">{t('stats.overrides')}</p>
                    </div>
                </div>
            </div>

            <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('member.searchPlaceholder')}
            />

            <PermissionDetailTable
                rows={filteredRows}
                expanded={expanded}
                filter={filter}
                sort={sort}
                onToggleExpand={toggleExpanded}
                onFilterChange={setFilter}
                onSortChange={setSort}
            />
        </div>
    )
}
