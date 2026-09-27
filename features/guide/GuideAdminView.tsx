'use client'

import { useTranslations } from 'next-intl'
import Button               from '@/components/ui/Button'
import Icon                 from '@/components/ui/Icon'
import Ribbon               from '@/components/ui/Ribbon'
import GuideSectionForm     from './components/GuideSectionForm'
import { useGuideAdmin }    from './hooks/useGuideAdmin'
import type { GuideRow }    from '@/lib/repositories/guide.repository'

const CATEGORY_COLORS: Record<string, 'active' | 'inactive' | 'pending' | 'approved'> = {
    quick_start: 'active',
    feature:     'approved',
    faq:         'pending',
    general:     'inactive',
}

export default function GuideAdminView() {
    const t = useTranslations('guide')
    const tc = useTranslations('common')
    const {
        sections, loading, saving, error,
        editing, creating,
        startCreate, startEdit, cancelForm, save, remove,
    } = useGuideAdmin()

    const showForm = creating || editing !== null

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('admin.title')}</h1>
                    <p className="text-sm text-muted mt-0.5">{t('admin.subtitle')}</p>
                </div>
                {!showForm && (
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

            {showForm && (
                <div className="rounded-xl border border-divider bg-surface p-6">
                    <h2 className="text-base font-semibold text-foreground mb-4">
                        {editing ? t('admin.editSection') : t('admin.newSection')}
                    </h2>
                    <GuideSectionForm
                        initial={editing ?? undefined}
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
                <div className="space-y-2">
                    {sections.map((row: GuideRow) => (
                        <div
                            key={row.id}
                            className="flex items-start gap-4 rounded-xl border border-divider bg-surface p-4"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium text-foreground">{row.title}</p>
                                    <Ribbon
                                        label={t(`categories.${row.category}`)}
                                        type={CATEGORY_COLORS[row.category] ?? 'inactive' as const}
                                        variant="rounded"
                                    />
                                    {!row.is_published && (
                                        <Ribbon label={t('admin.draft')} type="inactive" variant="rounded" />
                                    )}
                                </div>
                                <p className="text-xs text-muted mt-1">{t('admin.positionLabel', { position: row.position })}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    title={tc('actions.edit')}
                                    onClick={() => startEdit(row)}
                                    disabled={saving}
                                >
                                    <Icon name="pencil" size={14} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    title={tc('actions.delete')}
                                    onClick={() => remove(row.id)}
                                    disabled={saving}
                                >
                                    <Icon name="trash2" size={14} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
