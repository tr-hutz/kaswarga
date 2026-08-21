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

        case 'payment_import_staged':
        case 'payment_import_pending_approval':
        case 'payment_import_complete':
        case 'payment_import_approved':
        case 'payment_import_rejected':

            return '/payments'

        case 'income_import_staged':
        case 'income_import_pending_approval':
        case 'income_import_complete':
        case 'income_import_approved':
        case 'income_import_rejected':

            return '/income'

        case 'expense_import_staged':
        case 'expense_import_pending_approval':
        case 'expense_import_complete':
        case 'expense_import_approved':
        case 'expense_import_rejected':

            return '/expenses'

        case 'resident_import_complete':

            return '/residents'

        default:

            return '/notification'
    }
}
