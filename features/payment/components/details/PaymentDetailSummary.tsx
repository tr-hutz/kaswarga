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
                        text-muted
                    "
                >
                    {t('detail.residentName')}
                </p>

                <p
                    className="
                        font-medium
                        text-foreground
                    "
                >
                    {payment.name}
                </p>

            </div>

            <div>

                <p
                    className="
                        text-xs
                        text-muted
                    "
                >
                    {t('detail.house')}
                </p>

                <p
                    className="
                        font-medium
                        text-foreground
                    "
                >
                    {t('detail.blockPrefix')} {payment.block} / {payment.houseNumber}
                </p>

            </div>

            <div>

                <p
                    className="
                        text-xs
                        text-muted
                    "
                >
                    {t('detail.year')}
                </p>

                <p
                    className="
                        font-medium
                        text-foreground
                    "
                >
                    {payment.year}
                </p>

            </div>

            <div>

                <p
                    className="
                        text-xs
                        text-muted
                    "
                >
                    {t('detail.totalAmount')}
                </p>

                <p
                    className="
                        font-semibold
                        text-foreground
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