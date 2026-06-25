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

import PaymentToolbar from "./components/tables/PaymentToolbar";
import {exportToCSV, exportToExcel} from "../../lib/export/export-utils";

import {
    useDialog
} from '../../components/ui/DialogProvider'

export default function PembayaranView({

                                           /*
                                            |-------------------------------------------------------------
                                            | FILTERS
                                            |-------------------------------------------------------------
                                            */
                                           search,
                                           setSearch,

                                           kategori,
                                           setKategori,

                                           /*
                                            |-------------------------------------------------------------
                                            | DATA
                                            |-------------------------------------------------------------
                                            */
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

    const { prompt } = useDialog()

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
            await prompt({
                title: 'Tolak Pembayaran',
                description: 'Berikan alasan penolakan untuk warga.',
                placeholder: 'Masukkan alasan penolakan...',
                confirmLabel: 'Tolak',
                confirmClassName: 'bg-red-600 hover:bg-red-700 text-white'
            })

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

                <PaymentToolbar

                    search={search}
                    setSearch={setSearch}

                    kategori={kategori}
                    setKategori={setKategori}

                    onExportCSV={() => exportToCSV({data: rows, fileName: 'pembayaran.csv'})}
                    onExportExcel={() => exportToExcel({data: rows, fileName: 'pembayaran.xlsx'})}
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