// @ts-nocheck
'use client'

import {
    MONTHS
} from '../../../../constants/months'

export default function PaymentDetailMonths({

                                                details = []

                                            }) {

    return (

        <div>

            <h3
                className="
                    text-sm
                    font-semibold
                    mb-3
                "
            >
                Bulan Dibayar
            </h3>

            <div
                className="
                    flex
                    flex-wrap
                    gap-2
                "
            >

                {
                    details.map(detail => {

                        const month =
                            MONTHS.find(
                                item =>
                                    Number(item.id) ===
                                    Number(detail.bulan)
                            )

                        return (

                            <div
                                key={detail.id}
                                className="
                                    px-3
                                    py-2
                                    rounded-xl
                                    bg-slate-100
                                    text-sm
                                "
                            >

                                {month?.name}

                            </div>
                        )
                    })
                }

            </div>

        </div>
    )
}