// @ts-nocheck
'use client'

import WargaRow
    from './WargaRow'

export default function WargaTable({

                                       data = [],
                                       loading,

                                       onDetail,
                                       onEdit,

                                       refresh

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
        "
            >

                <thead
                    className="
            bg-slate-50
          "
                >

                <tr>

                    <th className="p-4 text-left">
                        Nama
                    </th>

                    <th className="p-4 text-left">
                        Jalan/Blok
                    </th>

                    <th className="p-4 text-left">
                        No. Rumah
                    </th>

                    <th className="p-4 text-left">
                        No HP
                    </th>

                    <th className="p-4 text-left">
                        Status
                    </th>

                    <th className="p-4 text-right">
                        Aksi
                    </th>

                </tr>

                </thead>

                <tbody>

                {
                    data.map(item => (

                        <WargaRow

                            key={item.id}

                            item={item}

                            onDetail={onDetail}

                            onEdit={onEdit}

                            refresh={refresh}

                        />

                    ))
                }

                </tbody>

            </table>

        </div>
    )
}