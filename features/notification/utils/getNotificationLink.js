export function getNotificationLink(
    notification
) {

    switch (
        notification.type
        ) {

        case 'payment_submitted':

            return '/pembayaran?status=pending'

        case 'payment_approved':

            return '/pembayaran?status=approved'

        case 'payment_rejected':

            return '/pembayaran?status=rejected'

        case 'expense_created':
        case 'expense_pending':

            return '/pengeluaran?status=pending'

        case 'expense_approved':

            return '/pengeluaran?status=approved'

        case 'expense_rejected':

            return '/pengeluaran?status=rejected'

        case 'ledger_created':

            return '/ledger'

        default:

            return '/notification'
    }
}