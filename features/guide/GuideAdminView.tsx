'use client'

import { useState, useMemo }  from 'react'
import { useTranslations }    from 'next-intl'
import Button                 from '@/components/ui/Button'
import Icon                   from '@/components/ui/Icon'
import Ribbon                 from '@/components/ui/Ribbon'
import GuideSectionForm       from './components/GuideSectionForm'
import { useGuideAdmin }      from './hooks/useGuideAdmin'
import type { GuideAdminRow } from '@/lib/repositories/guide.repository'

const CATEGORY_COLORS: Record<string, 'active' | 'inactive' | 'pending' | 'approved'> = {
    quick_start: 'active',
    feature:     'approved',
    faq:         'pending',
    general:     'inactive',
}

const LOCALE_LABELS: Record<string, string> = { id: 'ID', en: 'EN' }

export default function GuideAdminView() {
    const t  = useTranslations('guide')
    const tc = useTranslations('common')
    const {
        sections, loading, saving, error,
        editing, creating,
        startCreate, startEdit, cancelForm, save, remove,
    } = useGuideAdmin()

    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const [search,        setSearch]        = useState('')

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return sections
        return sections.filter(row => {
            const idTitle = row.translations.find(tr => tr.locale === 'id')?.title ?? ''
            const enTitle = row.translations.find(tr => tr.locale === 'en')?.title ?? ''
            return (
                idTitle.toLowerCase().includes(q) ||
                enTitle.toLowerCase().includes(q) ||
                t(`categories.${row.category}`).toLowerCase().includes(q)
            )
        })
    }, [sections, search, t])

    function handleStartEdit(row: GuideAdminRow) {
        setDeleteConfirm(null)
        startEdit(row)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('admin.title')}</h1>
                    <p className="text-sm text-muted mt-0.5">{t('admin.subtitle')}</p>
                </div>
                {!creating && editing === null && (
                    <Button size="sm" onClick={startCreate}>
                        <Icon name="plus" size={14} />
                        {t('admin.addSection')}
                    </Button>
                )}
            </div>

            {error && (
                <div className="px-4 py-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger">
                    {error}
                </div>
            )}

            {/* Create form */}
            {creating && (
                <div className="rounded-xl border border-primary/40 bg-surface p-6 shadow-sm">
                    <h2 className="text-base font-semibold text-foreground mb-4">
                        {t('admin.newSection')}
                    </h2>
                    <GuideSectionForm
                        saving={saving}
                        onSave={save}
                        onCancel={cancelForm}
                    />
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center h-40 text-muted text-sm">
                    {tc('states.loading')}
                </div>
            ) : sections.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-muted text-sm">
                    {t('admin.empty')}
                </div>
            ) : (
                <>
                    {/* Search */}
                    <div className="relative max-w-sm">
                        <Icon
                            name="search"
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                        />
                        <input
                            type="search"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t('admin.searchPlaceholder')}
                            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-divider bg-surface text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    {filtered.length === 0 ? (
                        <div className="flex items-center justify-center h-24 text-muted text-sm">
                            {t('admin.searchEmpty')}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filtered.map((row: GuideAdminRow) => {
                                const isEditing = editing?.id === row.id
                                const idTitle   = row.translations.find(tr => tr.locale === 'id')?.title
                                                  ?? row.translations[0]?.title
                                                  ?? '—'
                                return (
                                    <div
                                        key={row.id}
                                        className={`rounded-xl border bg-surface transition-colors duration-150 ${
                                            isEditing ? 'border-primary/40 shadow-sm' : 'border-divider'
                                        }`}
                                    >
                                        {isEditing ? (
                                            /* Inline expanded edit form */
                                            <div className="p-6">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Ribbon
                                                        label={t(`categories.${row.category}`)}
                                                        type={CATEGORY_COLORS[row.category] ?? 'inactive'}
                                                        variant="rounded"
                                                    />
                                                    <span className="text-sm font-medium text-foreground truncate">
                                                        {idTitle}
                                                    </span>
                                                </div>
                                                <GuideSectionForm
                                                    initial={editing}
                                                    saving={saving}
                                                    onSave={save}
                                                    onCancel={cancelForm}
                                                />
                                            </div>
                                        ) : (
                                            /* Normal row */
                                            <div className="flex items-start gap-4 p-4">
                                                <div className="flex-1 min-w-0 space-y-1.5">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Ribbon
                                                            label={t(`categories.${row.category}`)}
                                                            type={CATEGORY_COLORS[row.category] ?? 'inactive'}
                                                            variant="rounded"
                                                        />
                                                        {!row.is_published && (
                                                            <Ribbon label={t('admin.draft')} type="inactive" variant="rounded" />
                                                        )}
                                                        {row.translations.map(tr => (
                                                            <span
                                                                key={tr.locale}
                                                                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-primary/10 text-primary"
                                                            >
                                                                {LOCALE_LABELS[tr.locale] ?? tr.locale.toUpperCase()}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <p className="font-medium text-foreground text-sm">{idTitle}</p>
                                                    <p className="text-xs text-muted">{t('admin.positionLabel', { position: row.position })}</p>

                                                    {row.target_roles && row.target_roles.length > 0 && (
                                                        <p className="text-xs text-muted">
                                                            {t('form.targetRoles')}: {row.target_roles.join(', ')}
                                                        </p>
                                                    )}

                                                    {/* Feedback counts */}
                                                    {(row.feedback.helpful > 0 || row.feedback.not_helpful > 0) && (
                                                        <div className="flex items-center gap-3 pt-0.5">
                                                            <span className="flex items-center gap-1 text-xs text-muted">
                                                                <Icon name="thumbs-up" size={11} className="text-success" />
                                                                <span className="font-medium text-foreground">{row.feedback.helpful}</span>
                                                                {t('admin.feedbackHelpful')}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-xs text-muted">
                                                                <Icon name="thumbs-down" size={11} className="text-danger" />
                                                                <span className="font-medium text-foreground">{row.feedback.not_helpful}</span>
                                                                {t('admin.feedbackNotHelpful')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        title={tc('actions.edit')}
                                                        onClick={() => handleStartEdit(row)}
                                                        disabled={saving}
                                                    >
                                                        <Icon name="pencil" size={14} />
                                                    </Button>
                                                    {deleteConfirm === row.id ? (
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => { remove(row.id); setDeleteConfirm(null) }}
                                                                disabled={saving}
                                                                className="text-danger"
                                                            >
                                                                <Icon name="check" size={14} />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setDeleteConfirm(null)}
                                                                disabled={saving}
                                                            >
                                                                <Icon name="x" size={14} />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            title={tc('actions.delete')}
                                                            onClick={() => setDeleteConfirm(row.id)}
                                                            disabled={saving}
                                                        >
                                                            <Icon name="trash2" size={14} />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
