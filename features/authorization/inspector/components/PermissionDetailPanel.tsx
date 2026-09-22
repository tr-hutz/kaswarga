'use client'

import { useTranslations }                       from 'next-intl'
import Icon                                       from '@/components/ui/Icon'
import type { PermissionDetails, RoleWithCount } from '@/features/authorization/inspector/types'
import { ROLE_LABELS, MODULE_LABELS, PERMISSION_LABELS } from '@/features/authorization/inspector/labels'

function RoleCard({ role, variant }: { role: RoleWithCount; variant: 'granted' | 'grant' | 'revoke' }) {
    const colorMap = {
        granted: 'bg-primary/5 border-primary/20 text-primary',
        grant:   'bg-success/5 border-success/20 text-success',
        revoke:  'bg-danger/5  border-danger/20  text-danger',
    }
    const iconMap = {
        granted: 'shield'       as const,
        grant:   'check-circle' as const,
        revoke:  'x-circle'     as const,
    }
    return (
        <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${colorMap[variant]}`}>
            <div className="flex items-center gap-2">
                <Icon name={iconMap[variant]} size={14} />
                <span className="text-sm font-medium">{ROLE_LABELS[role.code] ?? role.name}</span>
            </div>
            <span className="text-xs font-mono opacity-70">{role.member_count} anggota</span>
        </div>
    )
}

interface Props {
    permission: { id: string; code: string; name: string; description: string | null }
    detail:     PermissionDetails
}

export default function PermissionDetailPanel({ permission, detail }: Props) {
    const t      = useTranslations('inspector')
    const moduleName = permission.code.split('.')[0] ?? 'other'

    return (
        <div className="space-y-5">
            {/* Header card */}
            <div className="rounded-xl border border-divider bg-surface p-5">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-lg bg-primary/10">
                        <Icon name="key-round" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-foreground">{PERMISSION_LABELS[permission.code] ?? permission.name}</h2>
                        <p className="text-sm font-mono text-muted mt-0.5">{permission.code}</p>
                        {permission.description && (
                            <p className="text-sm text-muted mt-1">{permission.description}</p>
                        )}
                        <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-canvas border border-divider text-muted font-medium">
                            {MODULE_LABELS[moduleName] ?? moduleName}
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-divider text-center">
                    <div>
                        <p className="text-xl font-bold text-foreground">{detail.stats.roleCount}</p>
                        <p className="text-xs text-muted mt-0.5">{t('stats.roles')}</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-foreground">{detail.effectiveMemberCount}</p>
                        <p className="text-xs text-muted mt-0.5">{t('stats.members')}</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-success">{detail.stats.grantOverrides}</p>
                        <p className="text-xs text-muted mt-0.5">{t('stats.grantOverrides')}</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-danger">{detail.stats.revokeOverrides}</p>
                        <p className="text-xs text-muted mt-0.5">{t('stats.revokeOverrides')}</p>
                    </div>
                </div>
            </div>

            {/* Granted by Role */}
            <div className="rounded-xl border border-divider bg-surface p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Icon name="shield" size={14} />
                    {t('sections.grantedByRole')}
                </h3>
                {detail.grantedRoles.length === 0 ? (
                    <p className="text-sm text-muted italic">{t('sections.noRoles')}</p>
                ) : detail.grantedRoles.map(r => (
                    <RoleCard key={r.id} role={r} variant="granted" />
                ))}
            </div>

            {/* Override (+) */}
            {detail.overrideGrants.length > 0 && (
                <div className="rounded-xl border border-divider bg-surface p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-success flex items-center gap-2">
                        <Icon name="check-circle" size={14} />
                        {t('sections.overrideGrant')}
                    </h3>
                    {detail.overrideGrants.map(r => (
                        <RoleCard key={r.id} role={r} variant="grant" />
                    ))}
                </div>
            )}

            {/* Override (-) */}
            {detail.overrideRevokes.length > 0 && (
                <div className="rounded-xl border border-divider bg-surface p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-danger flex items-center gap-2">
                        <Icon name="x-circle" size={14} />
                        {t('sections.overrideRevoke')}
                    </h3>
                    {detail.overrideRevokes.map(r => (
                        <RoleCard key={r.id} role={r} variant="revoke" />
                    ))}
                </div>
            )}

            {/* Effective member count */}
            <div className="rounded-xl border border-divider bg-canvas p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{t('sections.effectiveMembers')}</span>
                <span className="text-2xl font-bold text-primary">{detail.effectiveMemberCount}</span>
            </div>
        </div>
    )
}
