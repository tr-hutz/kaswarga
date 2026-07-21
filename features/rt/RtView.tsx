'use client'

import Icon from '@/components/ui/Icon'
import RtTable         from './components/RtTable'
import RtForm          from './components/RtForm'
import RtDeleteConfirm from './components/RtDeleteConfirm'
import { useTranslations } from 'next-intl'
import ErrorState from '@/components/ui/ErrorState'

interface RtViewProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data:         any[]
    loading:      boolean
    error:        boolean
    onRetry:      () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selected:     any
    formOpen:     boolean
    openCreate:   () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    openEdit:     (rt: any) => void
    closeForm:    () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleSubmit: (form: any) => Promise<any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delTarget:    any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setDelTarget: (t: any) => void
    deleting:     boolean
    handleDelete: () => void
}

export default function RtView({
    data,
    loading,
    error,
    onRetry,
    selected,
    formOpen,
    openCreate,
    openEdit,
    closeForm,
    handleSubmit,
    delTarget,
    setDelTarget,
    deleting,
    handleDelete
}: RtViewProps) {

    const t = useTranslations('rt')

    return (

        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-sm text-muted mt-0.5">
                        {t('subtitle')}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg px-4 py-2.5 transition-colors"
                >
                    <Icon name="plus" size={16} />
                    {t('addButton')}
                </button>
            </div>

            {/* Table */}
            {error
                ? <ErrorState onRetry={onRetry} />
                : <RtTable
                    data={data}
                    loading={loading}
                    onEdit={openEdit}
                    onDelete={setDelTarget}
                />
            }

            {/* Form Modal */}
            <RtForm
                open={formOpen}
                onClose={closeForm}
                rt={selected}
                onSubmit={handleSubmit}
            />

            {/* Delete Confirm */}
            <RtDeleteConfirm
                rt={delTarget}
                onConfirm={handleDelete}
                onCancel={() => setDelTarget(null)}
                loading={deleting}
            />

        </div>
    )
}