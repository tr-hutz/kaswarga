'use client'

import {
    formatRupiah
} from '../../../../lib/utils'

export default function PengeluaranDrawer({

                                              open,
                                              onClose,
                                              row

                                          }) {

    if (!open || !row) {
        return null
    }

    return (

        <div
            className="
        fixed
        inset-0
        bg-black/20
        z-50
        flex
        justify-end
      "

            onClick={onClose}
        >

            <div
                className="
          bg-white
          w-full
          max-w-lg
          h-full
          overflow-y-auto
          p-6
        "
            >

                <div
                    className="
            flex
            justify-between
            items-center
            mb-6
          "
                >

                    <h2
                        className="
              text-xl
              font-semibold
            "
                    >
                        Detail Pengeluaran
                    </h2>

                    <button
                        onClick={onClose}
                    >
                        ✕
                    </button>

                </div>

                <div
                    className="
            space-y-4
          "
                >

                    <Field
                        label="Kategori"
                        value={row.kategori}
                    />

                    <Field
                        label="Deskripsi"
                        value={row.deskripsi}
                    />

                    <Field
                        label="Tanggal"
                        value={row.tanggal}
                    />

                    <Field
                        label="Nominal"
                        value={`Rp ${formatRupiah(row.nominal)}`}
                    />

                </div>

                {

                    row.notaUrl && (

                        <div
                            className="
                mt-6
              "
                        >

                            <p
                                className="
                  text-sm
                  text-slate-500
                  mb-2
                "
                            >
                                Nota
                            </p>

                            <img

                                src={
                                    row.notaUrl
                                }

                                alt="Nota"

                                className="
                  rounded-xl
                  border
                "
                            />

                        </div>

                    )
                }

            </div>

        </div>
    )
}

function Field({

                   label,
                   value

               }) {

    return (

        <div>

            <p
                className="
          text-sm
          text-slate-500
        "
            >
                {label}
            </p>

            <p
                className="
          font-medium
        "
            >
                {value}
            </p>

        </div>
    )
}