'use client'

import {
    MONTHS
} from '../../../../constants/months'

function getMonthName(bulan) {

    const month =
        MONTHS.find(
            item =>
                Number(item.id) === Number(bulan)
        )

    return month?.short || '-'
}

function getStatusColor(status) {

    switch (status) {

        case 'approved':
            return 'bg-emerald-100 text-emerald-700'

        case 'pending':
            return 'bg-amber-100 text-amber-700'

        case 'rejected':
            return 'bg-red-100 text-red-700'

        default:
            return 'bg-slate-100 text-slate-700'
    }
}

export default function WargaPaymentHistory({

                                                paymentHistory = []

                                            }) {

    return (

        <div
            className="
        space-y-3
      "
        >

            <div>

                <h3
                    className="
            text-sm
            font-semibold
            text-slate-700
          "
                >
                    Histori Pembayaran
                </h3>

            </div>

            {
                paymentHistory.length === 0 && (

                    <div
                        className="
              text-sm
              text-slate-500
              border
              rounded-xl
              p-4
            "
                    >
                        Belum ada histori pembayaran
                    </div>
                )
            }

            {
                paymentHistory.map(item => (

                    <div
                        key={item.id}
                        className="
              border
              rounded-xl
              p-4
              flex
              items-start
              justify-between
              gap-4
            "
                    >

                        <div>

                            <div
                                className="
                  font-medium
                "
                            >
                                {getMonthName(item.bulan)}
                                {' '}
                                {item.tahun}
                            </div>

                            <div
                                className="
                  text-sm
                  text-slate-500
                "
                            >
                                Rp
                                {' '}
                                {Number(
                                    item.nominal || 0
                                ).toLocaleString('id-ID')}
                            </div>

                            <div
                                className="
                  text-xs
                  text-slate-400
                  mt-1
                "
                            >
                                {
                                    item.tanggal
                                        ? new Date(
                                            item.tanggal
                                        ).toLocaleDateString(
                                            'id-ID'
                                        )
                                        : '-'
                                }
                            </div>

                        </div>

                        <div>

              <span
                  className={`
                  text-xs
                  px-2
                  py-1
                  rounded-full
                  ${getStatusColor(item.status)}
                `}
              >
                {item.status}
              </span>

                        </div>

                    </div>
                ))
            }

        </div>
    )
}