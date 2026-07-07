// @ts-nocheck
export default function WargaDetailSummary({

                                               warga

                                           }) {

    if (!warga) {
        return null
    }

    return (

        <div
            className="
                space-y-4
            "
        >

            <div>

                <h2
                    className="
                        text-xl
                        font-bold
                    "
                >
                    {warga.name}
                </h2>

                <p
                    className="
                        text-sm
                        text-slate-500
                    "
                >
                    Blok {warga.block} / {warga.houseNumber}
                </p>

            </div>

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
                        No HP
                    </p>

                    <p
                        className="
                            font-medium
                        "
                    >
                        {warga.phone}
                    </p>

                </div>

                <div>

                    <p
                        className="
                            text-xs
                            text-slate-500
                        "
                    >
                        Status
                    </p>

                    <p
                        className="
                            font-medium
                        "
                    >
                        {warga.status}
                    </p>

                </div>

            </div>

        </div>
    )
}