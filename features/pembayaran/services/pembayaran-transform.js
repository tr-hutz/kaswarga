import {MONTHS} from '../../../constants/months'

function formatBulan(
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

function formatRumah(
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

export function transformPembayaran(
    pembayaran = []
) {

    return pembayaran.map(
        item => ({

            id:
            item.id,

            tahun:
            item.tahun,

            tanggal:
            item.tanggal,

            rt_id:
            item.rt_id,

            warga_id:
            item.warga_id,

            namaWarga:
                item.warga?.nama ||
                '-',

            rumah:
                formatRumah(
                    item.warga
                ),

            bulanLabel:
                formatBulan(
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

export function transformKonfirmasi(
    rows = []
) {

    return rows

        .filter(Boolean)

        .map(item => {

            const warga =
                Array.isArray(item.warga)
                    ? item.warga[0]
                    : item.warga

            const details =
                item
                    ?.detail_konfirmasi_pembayaran || []

            const bulanLabel =
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

            const totalBayar =
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

                tahun:
                item.tahun,

                status:
                item.status,

                totalBayar:
                    item.total_bayar ||
                    totalBayar,

                createdAt:
                item.created_at,

                buktiUrl:
                item.bukti_url,

                nama:
                    warga?.nama || '-',

                blok:
                    warga?.blok || '-',

                noRumah:
                    warga?.no_rumah || '-',

                bulanLabel,

                details
            }
        })
}