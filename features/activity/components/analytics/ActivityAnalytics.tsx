// @ts-nocheck
'use client'

export default function ActivityAnalytics({

                                              rows = []

                                          }) {

    const total =
        rows.length

    const approvals =
        rows.filter(

            r =>
                r.action ===
                'APPROVE_PEMBAYARAN'

        ).length

    const expenseCount =
        rows.filter(

            r =>
                r.entityType ===
                'pengeluaran'

        ).length

    const residentCount =
        rows.filter(

            r =>
                r.entityType ===
                'warga'

        ).length

    return (

        <div
            className="
                grid
                grid-cols-1
                md:grid-cols-4
                gap-4
            "
        >

            <Card
                title="Total Activity"
                value={total}
            />

            <Card
                title="Approvals"
                value={approvals}
            />

            <Card
                title="Pengeluaran"
                value={expenseCount}
            />

            <Card
                title="Warga Updates"
                value={residentCount}
            />

        </div>
    )
}

function Card({

                  title,
                  value

              }) {

    return (

        <div
            className="
                bg-white
                rounded-xl
                border
                p-5
            "
        >

            <p
                className="
                    text-sm
                    text-slate-500
                "
            >
                {title}
            </p>

            <h3
                className="
                    text-2xl
                    font-bold
                    mt-2
                "
            >
                {value}
            </h3>

        </div>
    )
}