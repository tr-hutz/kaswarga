'use client'

import { useState }         from 'react'
import { useTranslations }  from 'next-intl'
import Button                from '@/components/ui/Button'
import Icon                  from '@/components/ui/Icon'
import type { DebugData, PermissionDetail, PermissionSource } from './types'

interface Props {
    debugData:    DebugData
    onRefresh:    () => void
    onExportJson: () => void
}

const ALL_SECTIONS = ['currentUser', 'authorizationContext', 'roleResolution', 'permissionResolution', 'effectivePermission', 'requestInfo', 'decisionTrace'] as const
type SectionKey = typeof ALL_SECTIONS[number]

function SourceBadge({ source }: { source: PermissionSource }) {
    const t = useTranslations('debug')
    switch (source) {
        case 'override_grant':
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">{t('source.override_grant')}</span>
        case 'override_revoke':
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger">{t('source.override_revoke')}</span>
        case 'role':
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{t('source.role')}</span>
        default:
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-canvas text-muted">{t('source.none')}</span>
    }
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted uppercase tracking-wider">{label}</span>
            <span className={`text-sm text-foreground break-all ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
        </div>
    )
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
    return (
        <div className="rounded-xl border border-divider bg-canvas p-4 text-center">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color ?? 'text-foreground'}`}>{value}</p>
        </div>
    )
}

function SectionHeader({
    sectionKey, label, open, onToggle,
}: { sectionKey: SectionKey; label: string; open: boolean; onToggle: (k: SectionKey) => void }) {
    return (
        <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => onToggle(sectionKey)}
        >
            <h2 className="text-base font-semibold text-foreground">{label}</h2>
            <Icon name={open ? 'chevron-down' : 'chevron-right'} size={16} className="text-muted shrink-0" />
        </button>
    )
}

export default function DebugPanelView({ debugData: d, onRefresh, onExportJson }: Props) {
    const t  = useTranslations('debug')
    const tc = useTranslations('common')

    const [open, setOpen] = useState<Set<SectionKey>>(new Set(ALL_SECTIONS))

    function toggleSection(key: SectionKey) {
        setOpen(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    // Group permissions by module
    const byModule = d.permissionDetails.reduce<Record<string, PermissionDetail[]>>((acc, p) => {
        if (!acc[p.module]) acc[p.module] = []
        acc[p.module]!.push(p)
        return acc
    }, {})
    const modules = Object.keys(byModule).sort()

    const traceSteps = [
        { key: 'request',            label: t('trace.request'),            value: `GET ${d.currentPath}` },
        { key: 'permissionRequired', label: t('trace.permissionRequired'), value: d.requiredPermission },
        { key: 'rolePermission',     label: t('trace.rolePermission'),     value: `${d.rolePermissionCount} ${t('stats.rolePermissions')}` },
        { key: 'override',           label: t('trace.override'),           value: `+${d.overrideGrantCount} / −${d.overrideRevokeCount}` },
        { key: 'effectivePermission',label: t('trace.effectivePermission'),value: `${d.effectiveCount} ${t('stats.effectiveCount')}` },
        { key: 'finalDecision',      label: t('trace.finalDecision'),      value: d.authorizationResult, highlight: true },
    ]

    return (
        <div className="space-y-4">

            {/* Page header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-sm text-muted mt-0.5">{t('subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={onRefresh}>
                        <Icon name="refresh-cw" size={14} />
                        {t('refresh')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={onExportJson}>
                        <Icon name="download" size={14} />
                        {t('exportJson')}
                    </Button>
                </div>
            </div>

            {/* 1. Current User */}
            <div className="rounded-xl border border-divider bg-surface p-4 space-y-3">
                <SectionHeader sectionKey="currentUser" label={t('sections.currentUser')} open={open.has('currentUser')} onToggle={toggleSection} />
                {open.has('currentUser') && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-divider">
                        <Field label={t('fields.userId')}       value={d.userId}         mono />
                        <Field label={t('fields.membershipId')} value={d.membershipId}   mono />
                        <Field label={t('fields.neighborhoodId')}value={d.neighborhoodId}mono />
                        <Field label={t('fields.roleCode')}     value={d.roleCode} />
                        <Field label={t('fields.roleId')}       value={d.roleId}         mono />
                    </div>
                )}
            </div>

            {/* 2. AuthorizationContext */}
            <div className="rounded-xl border border-divider bg-surface p-4 space-y-3">
                <SectionHeader sectionKey="authorizationContext" label={t('sections.authorizationContext')} open={open.has('authorizationContext')} onToggle={toggleSection} />
                {open.has('authorizationContext') && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-divider">
                        <Field label={t('fields.requestId')} value={d.requestId} mono />
                        <Field label={t('fields.locale')}    value={d.locale} />
                        <Field label={t('fields.timezone')}  value={d.timezone} />
                        <Field label={t('fields.ipAddress')} value={d.ipAddress} mono />
                        <div className="col-span-2 md:col-span-3">
                            <Field label={t('fields.userAgent')} value={d.userAgent} />
                        </div>
                        <Field label={t('stats.effectiveCount')} value={`${d.effectiveCount} izin`} />
                        <Field label={t('stats.overrideGrants')}  value={`${d.overrideGrantCount}`} />
                        <Field label={t('stats.overrideRevokes')} value={`${d.overrideRevokeCount}`} />
                    </div>
                )}
            </div>

            {/* 3. Role Resolution */}
            <div className="rounded-xl border border-divider bg-surface p-4 space-y-3">
                <SectionHeader sectionKey="roleResolution" label={t('sections.roleResolution')} open={open.has('roleResolution')} onToggle={toggleSection} />
                {open.has('roleResolution') && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-divider">
                        <Field label={t('fields.roleCode')} value={d.roleCode} />
                        <Field label={t('fields.roleId')}   value={d.roleId}   mono />
                        <Field label="Role Name"             value={d.roleName} />
                        <Field label="Status"               value={tc('status.active')} />
                        <Field label="Role Source"           value="Membership" />
                    </div>
                )}
            </div>

            {/* 4. Permission Resolution */}
            <div className="rounded-xl border border-divider bg-surface p-4 space-y-3">
                <SectionHeader sectionKey="permissionResolution" label={t('sections.permissionResolution')} open={open.has('permissionResolution')} onToggle={toggleSection} />
                {open.has('permissionResolution') && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-divider">
                        <StatCard label={t('stats.rolePermissions')} value={d.rolePermissionCount} color="text-primary" />
                        <StatCard label={t('stats.overrideGrants')}  value={d.overrideGrantCount}  color="text-success" />
                        <StatCard label={t('stats.overrideRevokes')} value={d.overrideRevokeCount} color="text-danger" />
                        <StatCard label={t('stats.effectiveCount')}  value={d.effectiveCount} />
                    </div>
                )}
            </div>

            {/* 5. Effective Permission */}
            <div className="rounded-xl border border-divider bg-surface p-4 space-y-3">
                <SectionHeader sectionKey="effectivePermission" label={t('sections.effectivePermission')} open={open.has('effectivePermission')} onToggle={toggleSection} />
                {open.has('effectivePermission') && (
                    <div className="pt-2 border-t border-divider space-y-4">
                        {modules.map(mod => (
                            <div key={mod}>
                                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 capitalize">{mod}</p>
                                <div className="rounded-lg border border-divider overflow-hidden">
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {byModule[mod]!.map(p => (
                                                <tr key={p.id} className="border-b border-divider last:border-0 hover:bg-canvas/40">
                                                    <td className="px-4 py-2.5 font-medium text-foreground">{p.name}</td>
                                                    <td className="px-4 py-2.5 font-mono text-xs text-muted">{p.code}</td>
                                                    <td className="px-4 py-2.5"><SourceBadge source={p.source} /></td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        {p.effective
                                                            ? <span className="text-success"><Icon name="check-circle" size={16} /></span>
                                                            : <span className="text-danger"><Icon name="x-circle" size={16} /></span>
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 6. Request Information */}
            <div className="rounded-xl border border-divider bg-surface p-4 space-y-3">
                <SectionHeader sectionKey="requestInfo" label={t('sections.requestInfo')} open={open.has('requestInfo')} onToggle={toggleSection} />
                {open.has('requestInfo') && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-divider">
                        <Field label={t('fields.method')}              value={d.method} />
                        <Field label={t('fields.currentPath')}         value={d.currentPath} mono />
                        <Field label={t('fields.requiredPermission')}  value={d.requiredPermission} mono />
                        <div>
                            <span className="text-xs text-muted uppercase tracking-wider">{t('fields.authorizationResult')}</span>
                            <p className="mt-0.5 text-sm font-bold text-success">{d.authorizationResult}</p>
                        </div>
                        <Field label={t('generatedAt')} value={new Date(d.generatedAt).toLocaleString('id-ID')} />
                    </div>
                )}
            </div>

            {/* 7. Decision Trace */}
            <div className="rounded-xl border border-divider bg-surface p-4 space-y-3">
                <SectionHeader sectionKey="decisionTrace" label={t('sections.decisionTrace')} open={open.has('decisionTrace')} onToggle={toggleSection} />
                {open.has('decisionTrace') && (
                    <div className="pt-2 border-t border-divider">
                        <div className="flex flex-col items-start gap-0">
                            {traceSteps.map((step, i) => (
                                <div key={step.key} className="flex flex-col items-start w-full">
                                    <div className={`rounded-lg border px-4 py-3 w-full max-w-sm ${
                                        step.highlight
                                            ? 'border-success bg-success/5'
                                            : 'border-divider bg-canvas'
                                    }`}>
                                        <p className="text-xs text-muted uppercase tracking-wider mb-0.5">{step.label}</p>
                                        <p className={`text-sm font-medium ${step.highlight ? 'text-success' : 'text-foreground'}`}>
                                            {step.value}
                                        </p>
                                    </div>
                                    {i < traceSteps.length - 1 && (
                                        <div className="ml-4 my-1 text-muted">
                                            <Icon name="chevron-down" size={16} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}
