'use client'

import Icon from '@/components/ui/Icon'
import { useTranslations } from 'next-intl'

interface RtTableProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data:     any[]
    loading:  boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onEdit:   (rt: any) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onDelete: (rt: any) => void
}

export default function RtTable({ data, loading, onEdit, onDelete }: RtTableProps) {

    const t = useTranslations('rt')
    const tc = useTranslations('common')

    if (loading) {
        return (
            <div className="py-16 text-center text-sm text-dark-6">
                {t('table.loading')}
            </div>
        )
    }

    if (!data?.length) {
        return (
            <div className="py-16 text-center text-sm text-dark-6">
                {t('table.empty')}
            </div>
        )
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-stroke">
            <table className="w-full text-sm">
                <thead className="bg-body text-xs text-dark-5 uppercase">
                    <tr>
                        <th className="px-4 py-3 text-left">{t('table.name')}</th>
                        <th className="px-4 py-3 text-left">{t('table.code')}</th>
                        <th className="px-4 py-3 text-left">{t('table.city')}</th>
                        <th className="px-4 py-3 text-center">{t('table.status')}</th>
                        <th className="px-4 py-3 text-center">{t('table.actions')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-stroke">
                    {data.map(rt => (
                        <tr key={rt.id} className="hover:bg-body transition-colors">
                            <td className="px-4 py-3 font-medium">{rt.name}</td>
                            <td className="px-4 py-3 text-dark-5">{rt.code || '-'}</td>
                            <td className="px-4 py-3 text-dark-5">{rt.city || '-'}</td>
                            <td className="px-4 py-3 text-center">
                                <span className={`
                                    inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                    ${rt.active ? 'bg-success/5 text-success' : 'bg-danger/5 text-danger'}
                                `}>
                                    {rt.active ? tc('status.active') : tc('status.inactive')}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => onEdit(rt)}
                                        className="p-1.5 rounded-lg hover:bg-body text-dark-5 hover:text-primary transition-colors"
                                        title="Edit"
                                    >
                                        <Icon name="pencil" size={15} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(rt)}
                                        className="p-1.5 rounded-lg hover:bg-danger/5 text-dark-5 hover:text-danger transition-colors"
                                        title="Hapus"
                                    >
                                        <Icon name="trash2" size={15} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
