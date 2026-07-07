// @ts-nocheck
'use client'

export default function PaymentDetailSummary({

                                                 payment

                                             }) {

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
                    Nama Warga
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
                    Rumah
                </p>

                <p
                    className="
                        font-medium
                    "
                >
                    Blok {payment.block} / {payment.houseNumber}
                </p>

            </div>

            <div>

                <p
                    className="
                        text-xs
                        text-slate-500
                    "
                >
                    Tahun
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
                    Total Bayar
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