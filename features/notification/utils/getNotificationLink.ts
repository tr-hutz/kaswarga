export function getNotificationLink(
    notification: { type: string }
) {

    switch (
        notification.type
        ) {

        case 'payment_submitted':

            return '/payments?status=pending'

        case 'payment_approved':

            return '/payments?status=approved'

        case 'payment_rejected':

            return '/payments?status=rejected'

        case 'expense_created':
        case 'expense_pending':

            return '/expenses?status=pending'

        case 'expense_approved':

            return '/expenses?status=approved'

        case 'expense_rejected':

            return '/expenses?status=rejected'

        case 'ledger_created':

            return '/ledger'

        case 'import_pending_approval':
        case 'import_complete':
        case 'import_rejected':

            return '/payments'

        default:

            return '/notification'
    }
}
