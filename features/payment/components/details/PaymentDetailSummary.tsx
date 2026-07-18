'use client'

import { useTranslations } from 'next-intl'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PaymentDetailSummary({ payment }: { payment: any }) {

    const t = useTranslations('payments')

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
                        text-dark-5
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
                        text-dark-5
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
                        text-dark-5
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
                        text-dark-5
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