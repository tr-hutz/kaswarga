// @ts-nocheck
'use client'

import RegistrationCard from './components/RegistrationCard'
import { useTranslations } from 'next-intl'

const TAB_KEYS = ['pending', 'approved', 'rejected', 'all']

export default function RtRegistrationView({ requests, loading, filter, setFilter, refresh }) {
    const t = useTranslations('rtRegistration')

    return (
        <div className="space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold">{t('title')}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {t('subtitle')}
                </p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {TAB_KEYS.map(key => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setFilter(key)}
                        className={`
                            flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition
                            ${filter === key
                                ? 'bg-black text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                            }
                        `}
                    >
                        {t(`tabs.${key}`)}
                        {filter === key && requests.length > 0 && (
                            <span className={`text-xs rounded-full px-1.5 py-0.5 leading-none ${
                                filter === key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                                {requests.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-sm">{t('empty')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map(req => (
                        <RegistrationCard key={req.id} req={req} onAction={refresh} />
                    ))}
                </div>
            )}

        </div>
    )
}
