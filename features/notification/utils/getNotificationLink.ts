// Roles that have access to the income module (/income page)
const INCOME_MODULE_ROLES = new Set(['RT_ADMIN', 'RT_CHAIR', 'TREASURER', 'SECRETARY'])

// Roles that have access to the payments module (/payments page)
const PAYMENTS_MODULE_ROLES = new Set(['RT_ADMIN', 'RT_CHAIR', 'TREASURER', 'SECRETARY', 'RESIDENT'])

// Roles that have access to the expenses module (/expenses page)
const EXPENSES_MODULE_ROLES = new Set(['RT_ADMIN', 'RT_CHAIR', 'TREASURER', 'SECRETARY', 'RESIDENT'])

export function getNotificationLink(
    notification: { type: string },
    role?: string | null,
): string {

    switch (notification.type) {

        case 'payment_submitted':
            return '/payments?status=pending'

        case 'payment_approved':
            return '/payments?status=approved'

        case 'payment_rejected':
            return '/payments?status=rejected'

        case 'expense_created':
        case 'expense_pending':
            return EXPENSES_MODULE_ROLES.has(role ?? '') ? '/expenses?status=pending' : '/dashboard'

        case 'expense_approved':
            return EXPENSES_MODULE_ROLES.has(role ?? '') ? '/expenses?status=approved' : '/dashboard'

        case 'expense_rejected':
            return EXPENSES_MODULE_ROLES.has(role ?? '') ? '/expenses?status=rejected' : '/dashboard'

        case 'ledger_created':
            return '/ledger'

        case 'payment_import_staged':
        case 'payment_import_pending_approval':
        case 'payment_import_complete':
        case 'payment_import_approved':
        case 'payment_import_rejected':
            return '/payments'

        case 'income_pending':
            return INCOME_MODULE_ROLES.has(role ?? '') ? '/income?status=pending' : '/dashboard'

        case 'income_approved':
            // Submitter may be a RESIDENT who cannot access /income
            return INCOME_MODULE_ROLES.has(role ?? '') ? '/income?status=approved' : '/dashboard'

        case 'income_rejected':
            // Submitter may be a RESIDENT who cannot access /income
            return INCOME_MODULE_ROLES.has(role ?? '') ? '/income?status=rejected' : '/dashboard'

        case 'campaign_activated':
        case 'campaign_completed':
            return INCOME_MODULE_ROLES.has(role ?? '') ? '/income?tab=campaigns' : '/dashboard'

        case 'income_import_staged':
        case 'income_import_pending_approval':
        case 'income_import_complete':
        case 'income_import_approved':
        case 'income_import_rejected':
            return INCOME_MODULE_ROLES.has(role ?? '') ? '/income' : '/dashboard'

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
