'use client'

import PaymentTable
    from './components/tables/PaymentTable'

import PaymentDetailDrawer
    from './components/details/PaymentDetailDrawer'

import {
    usePaymentDetail
} from './hooks/usePaymentDetail'

import {
    useApprovalActions
} from './hooks/useApprovalAction'

import ExportButtons
    from './components/exports/ExportButtons'

export default function PembayaranView({

                                           rows,

                                           reloadData

                                       }) {

    /*
     |-------------------------------------------------------------
     | DETAIL
     |-------------------------------------------------------------
     */

    const {

        open,

        selectedPayment,

        openDetail,

        closeDetail

    } = usePaymentDetail()

    /*
     |-------------------------------------------------------------
     | APPROVAL
     |-------------------------------------------------------------
     */

    const {

        loading,

        approve,

        reject

    } = useApprovalActions({

        onSuccess: () => {

            closeDetail()

            if (reloadData) {

                reloadData()
            }
        }
    })

    /*
     |-------------------------------------------------------------
     | APPROVE
     |-------------------------------------------------------------
     */

    async function handleApprove(
        payment
    ) {

        await approve(
            payment.id
        )
    }

    /*
     |-------------------------------------------------------------
     | REJECT
     |-------------------------------------------------------------
     */

    async function handleReject(
        payment
    ) {

        const alasan =
            prompt(
                'Masukkan alasan penolakan'
            )

        if (!alasan) {
            return
        }

        await reject(
            payment.id,
            alasan
        )
    }

    /*
     |-------------------------------------------------------------
     | RENDER
     |-------------------------------------------------------------
     */

    return (

        <div
            className="
                space-y-6
            "
        >
            <div
                className="
        flex
        items-center
        justify-between
    "
            >

                <div>

                    <h1
                        className="
                text-2xl
                font-bold
            "
                    >
                        Pembayaran
                    </h1>

                    <p
                        className="
                text-sm
                text-slate-500
            "
                    >
                        Riwayat pembayaran warga
                    </p>

                </div>

                <ExportButtons
                    rows={rows}
                />
            </div>

            <PaymentTable
                rows={rows}
                onSelect={openDetail}
            />

            <PaymentDetailDrawer
                open={open}
                payment={selectedPayment}
                onClose={closeDetail}
                onApprove={handleApprove}
                onReject={handleReject}
                loading={loading}
            />

        </div>
    )
}