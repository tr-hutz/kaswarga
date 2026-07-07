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
                        item.bulan
                )

            return (
                month?.short ||
                item.bulan
            )
        })

        .join(', ')
}

function formatAddress(
    warga
) {

    if (!warga) {
        return '-'
    }

    return [
        warga.blok,
        warga.no_rumah
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
                item.nominal || 0
            ),

        0
    )
}

export function transformPayment(
    payments = []
) {

    return payments.map(
        item => ({

            id:
            item.id,

            year:
            item.tahun,

            date:
            item.tanggal,

            rt_id:
            item.rt_id,

            warga_id:
            item.warga_id,

            residentName:
                item.warga?.nama ||
                '-',

            address:
                formatAddress(
                    item.warga
                ),

            monthLabel:
                formatMonthIds(
                    item.detail_pembayaran
                ),

            total:
                calculateTotal(
                    item.detail_pembayaran
                ),

            details:
                item.detail_pembayaran || [],

            status:
                'approved'

        })
    )
}

export function transformConfirmation(
    rows = []
) {

    return rows

        .filter(Boolean)

        .map(item => {

            const resident =
                Array.isArray(item.warga)
                    ? item.warga[0]
                    : item.warga

            const details =
                item
                    ?.detail_konfirmasi_pembayaran || []

            const monthLabel =
                details
                    .map(detail => {

                        const month =
                            MONTHS.find(
                                m =>
                                    Number(m.id) ===
                                    Number(detail.bulan)
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
                                detail.nominal || 0
                            )
                        )

                    },
                    0
                )

            return {

                id:
                item.id,

                year:
                item.tahun,

                status:
                item.status,

                totalAmount:
                    item.total_bayar ||
                    totalAmount,

                createdAt:
                item.created_at,

                proofUrl:
                item.bukti_url,

                name:
                    resident?.nama || '-',

                block:
                    resident?.blok || '-',

                houseNumber:
                    resident?.no_rumah || '-',

                monthLabel,

                details
            }
        })
}
