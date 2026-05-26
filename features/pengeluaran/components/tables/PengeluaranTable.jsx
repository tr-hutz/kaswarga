'use client'

import PengeluaranRow
    from './PengeluaranRow'

export default function PengeluaranTable({

                                             rows = [],
                                             loading,

                                             onSelect,
                                             onEdit,
                                             onDelete

                                         }) {

    if (loading) {

        return (

            <div>
                Loading...
            </div>
        )
    }

    return (

        <div
            className="
        bg-white
        rounded-2xl
        border
        overflow-hidden
      "
        >

            <table
                className="
          w-full
          text-sm
        "
            >

                <thead
                    className="
            bg-slate-50
          "
                >

                <tr>

                    <th className="p-4 text-left">
                        Tanggal
                    </th>

                    <th className="p-4 text-left">
                        Kategori
                    </th>

                    <th className="p-4 text-left">
                        Deskripsi
                    </th>

                    <th className="p-4 text-right">
                        Nominal
                    </th>

                    <th className="p-4 text-right">
                        Aksi
                    </th>

                </tr>

                </thead>

                <tbody>

                {

                    rows.map(row => (

                        <PengeluaranRow

                            key={row.id}

                            row={row}

                            onSelect={onSelect}

                            onEdit={onEdit}

                            onDelete={onDelete}

                        />

                    ))
                }

                </tbody>

            </table>

        </div>
    )
}