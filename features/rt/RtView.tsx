// @ts-nocheck
'use client'

import { Plus }        from 'lucide-react'
import RtTable         from './components/RtTable'
import RtForm          from './components/RtForm'
import RtDeleteConfirm from './components/RtDeleteConfirm'
import { useTranslations } from 'next-intl'

export default function RtView({
    data,
    loading,
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
}) {

    const t = useTranslations('rt')

    return (

        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold">{t('title')}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {t('subtitle')}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-black text-white text-sm rounded-xl px-4 py-2.5"
                >
                    <Plus size={16} />
                    {t('addButton')}
                </button>
            </div>

            {/* Table */}
            <RtTable
                data={data}
                loading={loading}
                onEdit={openEdit}
                onDelete={setDelTarget}
            />

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