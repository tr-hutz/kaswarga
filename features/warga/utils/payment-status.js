export function getPaymentStatus(
    paidCount,
    currentMonth
) {

    if (
        paidCount >= currentMonth
    ) {
        return 'paid'
    }

    if (
        paidCount >= currentMonth - 2
    ) {
        return 'almost-paid'
    }

    if (paidCount > 0) {
        return 'delinquent'
    }

    return 'never-paid'
}