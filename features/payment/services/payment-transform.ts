// @ts-nocheck
import {MONTHS} from '../../../constants/months'

function formatMonthIds(
    detail = []
) {

    return detail

        .map(item => {

            const month =
                MONTHS.find(
                    month =>
                        month.id ===
                        item.month
                )

            return (
                month?.short ||
                item.month
            )
        })

        .join(', ')
}

function formatAddress(
    resident
) {

    if (!resident) {
        return '-'
    }

    return [
        resident.block,
        resident.house_number
    ]

        .filter(Boolean)

        .join(' - ')
}

function calculateTotal(
    detail = []
) {

    return detail.reduce(
        (
            total,
            item
        ) =>

            total +
            (
                item.amount || 0
            ),

        0
    )
}

export function transformPayment(
    payments: any[] = []
) {

    return payments.map(
        item => ({

            id:
            item.id,

            year:
            item.year,

            date:
            item.date,

            rt_id:
            item.rt_id,

            resident_id:
            item.resident_id,

            residentName:
                item.residents?.name ||
                '-',

            address:
                formatAddress(
                    item.residents
                ),

            monthLabel:
                formatMonthIds(
                    item.payment_details
                ),

            total:
                calculateTotal(
                    item.payment_details
                ),

            details:
                item.payment_details || [],

            status:
                'approved'

        })
    )
}

export function transformConfirmation(
    rows: any[] = []
) {

    return rows

        .filter(Boolean)

        .map(item => {

            const resident =
                Array.isArray(item.residents)
                    ? item.residents[0]
                    : item.residents

            const details =
                item
                    ?.confirmation_details || []

            const monthLabel =
                details
                    .map(detail => {

                        const month =
                            MONTHS.find(
                                m =>
                                    Number(m.id) ===
                                    Number(detail.month)
                            )

                        return month?.short

                    })
                    .filter(Boolean)
                    .join(', ')

            const totalAmount =
                details.reduce(
                    (sum, detail) => {

                        return (
                            sum +
                            Number(
                                detail.amount || 0
                            )
                        )

                    },
                    0
                )

            return {

                id:
                item.id,

                year:
                item.year,

                status:
                item.status,

                totalAmount:
                    item.total_amount ||
                    totalAmount,

                createdAt:
                item.created_at,

                proofUrl:
                item.proof_url,

                name:
                    resident?.name || '-',

                block:
                    resident?.block || '-',

                houseNumber:
                    resident?.house_number || '-',

                monthLabel,

                details
            }
        })
}
