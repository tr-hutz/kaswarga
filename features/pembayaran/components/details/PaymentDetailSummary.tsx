// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'

export default function PaymentDetailSummary({

                                                 payment

                                             }) {

    const t = useTranslations('pembayaran')

    if (!payment) {
        return null
    }

    return (

        <div
            className="
                grid
                grid-cols-2
                gap-4
            "
        >

            <div>

                <p
                    className="
                        text-xs
                        text-slate-500
                    "
                >
                    {t('detail.residentName')}
                </p>

                <p
                    className="
                        font-medium
                    "
                >
                    {payment.name}
                </p>

            </div>

            <div>

                <p
                    className="
                        text-xs
                        text-slate-500
                    "
                >
                    {t('detail.house')}
                </p>

                <p
                    className="
                        font-medium
                    "
                >
                    {t('detail.blockPrefix')} {payment.block} / {payment.houseNumber}
                </p>

            </div>

            <div>

                <p
                    className="
                        text-xs
                        text-slate-500
                    "
                >
                    {t('detail.year')}
                </p>

                <p
                    className="
                        font-medium
                    "
                >
                    {payment.year}
                </p>

            </div>

            <div>

                <p
                    className="
                        text-xs
                        text-slate-500
                    "
                >
                    {t('detail.totalAmount')}
                </p>

                <p
                    className="
                        font-semibold
                    "
                >
                    Rp {
                    Number(
                        payment.totalAmount || 0
                    ).toLocaleString('id-ID')
                }
                </p>

            </div>

        </div>
    )
}