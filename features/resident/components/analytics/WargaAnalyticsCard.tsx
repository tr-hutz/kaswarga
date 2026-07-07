// @ts-nocheck
'use client'

export default function WargaAnalyticsCards({

                                                paidCount = 0,
                                                arrears = 0,
                                                totalAmount = 0

                                            }) {

    const cards = [

        {
            label: 'Total Bayar',
            value: paidCount
        },

        {
            label: 'Tunggakan',
            value: arrears
        },

        {
            label: 'Total Nominal',
            value:
                `Rp ${totalAmount.toLocaleString('id-ID')}`
        }
    ]

    return (

        <div
            className="
        grid
        grid-cols-1
        md:grid-cols-3
        gap-4
      "
        >

            {
                cards.map(card => (

                    <div
                        key={card.label}
                        className="
              bg-white
              border
              rounded-2xl
              p-5
            "
                    >

                        <p className="text-sm text-slate-500">
                            {card.label}
                        </p>

                        <h2
                            className="
                text-2xl
                font-bold
                mt-2
              "
                        >
                            {card.value}
                        </h2>

                    </div>
                ))
            }

        </div>
    )
}