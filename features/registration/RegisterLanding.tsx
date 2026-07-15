// @ts-nocheck
'use client'

import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { useTranslations } from 'next-intl'

export default function RegisterLanding() {
    const t = useTranslations('registration')
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md space-y-6">

                <div className="text-center">
                    <h1 className="text-2xl font-bold">{t('landing.title')}</h1>
                </div>

                <div className="grid gap-4">

                    <Link href="/register/rt" className="block">
                        <div className="bg-white border rounded-2xl p-6 hover:shadow-md transition cursor-pointer">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                    <Icon name="building2" size={24} />
                                </div>
                                <div>
                                    <h2 className="font-semibold">{t('landing.asRt')}</h2>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/register/resident" className="block">
                        <div className="bg-white border rounded-2xl p-6 hover:shadow-md transition cursor-pointer">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                                    <Icon name="users" size={24} />
                                </div>
                                <div>
                                    <h2 className="font-semibold">{t('landing.asResident')}</h2>
                                </div>
                            </div>
                        </div>
                    </Link>

                </div>

                <p className="text-center text-sm text-gray-500">
                    {t('landing.hasAccount')}{' '}
                    <Link href="/login" className="text-blue-600 hover:underline font-medium">
                        {t('landing.signIn')}
                    </Link>
                </p>

            </div>
        </div>
    )
}
