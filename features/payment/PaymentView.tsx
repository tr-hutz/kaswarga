// @ts-nocheck
'use client'

import PaymentTable
    from './components/tables/PaymentTable'
import ErrorState from '@/components/ui/ErrorState'

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
import { useTranslations } from 'next-intl'

export default function PaymentView({

                                           /*
                                            |-------------------------------------------------------------
                                            | FILTERS
                                            |-------------------------------------------------------------
                                            */
                                           search,
                                           setSearch,

                                           status,
                                           setStatus,

                                           /*
                                            |-------------------------------------------------------------
                                            | DATA
                                            |-------------------------------------------------------------
                                            */
                                           rows,
                                           loading,
                                           error,
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

    const t = useTranslations('payments')
    const { prompt } = useDialog()

    const {

        loading: approvalLoading,

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
                title: t('reject.title'),
                description: t('reject.description'),
                placeholder: t('reject.placeholder'),
                confirmLabel: t('reject.confirmLabel'),
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

                    status={status}
                    setStatus={setStatus}

                    onExportCSV={() => exportToCSV({data: rows, fileName: 'payments.csv'})}
                    onExportExcel={() => exportToExcel({data: rows, fileName: 'payments.xlsx'})}
                />
            </div>

            {error
                ? <ErrorState onRetry={reloadData} />
                : <PaymentTable
                    rows={rows}
                    loading={loading}
                    onSelect={openDetail}
                />
            }

            <PaymentDetailDrawer
                open={open}
                payment={selectedPayment}
                onClose={closeDetail}
                onApprove={handleApprove}
                onReject={handleReject}
                loading={approvalLoading}
            />

        </div>
    )
}