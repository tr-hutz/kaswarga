'use client'

import Link              from 'next/link'
import { useTranslations } from 'next-intl'
import Icon              from '@/components/ui/Icon'
import type { IconName } from '@/components/ui/Icon'
import type { SuperAdminStats } from '../hooks/useSuperAdminHome'
import type { Database } from '@/types/database'

type ActivityLog = Database['public']['Tables']['activity_logs']['Row']

interface Props {
    stats:    SuperAdminStats
    activity: ActivityLog[]
    loading:  boolean
    error:    boolean
    reload:   () => void
}

interface QuickLink {
    href:     string
    icon:     IconName
    labelKey: string
}

const QUICK_LINKS: QuickLink[] = [
    { href: '/rt/registration', icon: 'clipboard-list', labelKey: 'rtRegistration' },
    { href: '/rt',              icon: 'building2',      labelKey: 'rt'              },
    { href: '/users',           icon: 'user-cog',       labelKey: 'users'           },
    { href: '/activity',        icon: 'activity',       labelKey: 'activity'        },
]

export default function SuperAdminHomeView({ stats, activity, loading, error, reload }: Props) {
    const t  = useTranslations('home')
    const tn = useTranslations('nav')

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label={t('superAdmin.stats.totalRt')}    value={stats.totalRt}    loading={loading} color="primary" />
                <StatCard
                    label={t('superAdmin.stats.pendingRt')}
                    value={stats.pendingRt}
                    loading={loading}
                    color={stats.pendingRt > 0 ? 'warning' : 'success'}
                    href="/rt/registration"
                />
                <StatCard label={t('superAdmin.stats.totalUsers')} value={stats.totalUsers} loading={loading} color="primary" />
            </div>

            {/* Quick links */}
            <div>
                <h2 className="text-sm font-semibold text-muted mb-3">{t('superAdmin.quickLinks')}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {QUICK_LINKS.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center gap-3 bg-surface border border-divider rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-canvas transition-colors"
                        >
                            <Icon name={link.icon} size={18} className="text-primary shrink-0" />
                            {tn(link.labelKey as Parameters<typeof tn>[0])}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent activity */}
            <div className="bg-surface rounded-xl border border-divider shadow-card">
                <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
                    <h2 className="text-base font-semibold text-foreground">{t('superAdmin.recentActivity')}</h2>
                    <Link href="/activity" className="flex items-center gap-1 text-sm text-primary hover:underline">
                        {t('superAdmin.viewAll')}
                        <Icon name="arrow-right" size={14} />
                    </Link>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-5 h-5 border-2 border-divider border-t-primary rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center gap-2 py-8">
                        <p className="text-sm text-muted">{t('superAdmin.loadError')}</p>
                        <button onClick={reload} className="text-sm text-primary hover:underline">
                            {t('superAdmin.retry')}
                        </button>
                    </div>
                ) : activity.length === 0 ? (
                    <p className="px-6 py-8 text-center text-sm text-muted">{t('superAdmin.noActivity')}</p>
                ) : (
                    <ul className="divide-y divide-divider">
                        {activity.map(entry => (
                            <li key={entry.id} className="flex items-start gap-3 px-6 py-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground truncate">{entry.description}</p>
                                    <p className="text-xs text-muted mt-0.5">{entry.actor_name ?? '—'}</p>
                                </div>
                                <time className="shrink-0 text-xs text-muted">
                                    {new Date(entry.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                </time>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

function StatCard({ label, value, loading, color, href }: {
    label:   string
    value:   number
    loading: boolean
    color:   'primary' | 'warning' | 'success'
    href?:   string
}) {
    const colorClass = { primary: 'text-primary', warning: 'text-warning', success: 'text-success' }[color]

    const inner = (
        <div className="bg-surface rounded-xl border border-divider shadow-card px-6 py-5 space-y-1">
            <p className="text-sm text-muted">{label}</p>
            {loading
                ? <div className="h-8 w-12 rounded bg-divider animate-pulse" />
                : <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
            }
        </div>
    )

    return href
        ? <Link href={href} className="block hover:opacity-80 transition-opacity">{inner}</Link>
        : inner
}
