interface ResidentAnalyticsItem {
    paidCount: number
}

interface PaymentHealthInput {
    residents: ResidentAnalyticsItem[]
    currentMonth: number
}

export function buildPaymentHealth({ residents, currentMonth }: PaymentHealthInput) {
    const list = residents || []

    return {
        totalResidents: list.length,
        paid:       list.filter(r => r.paidCount >= currentMonth).length,
        almostPaid: list.filter(r => r.paidCount >= currentMonth - 2 && r.paidCount < currentMonth).length,
        delinquent: list.filter(r => r.paidCount > 0 && r.paidCount < currentMonth - 2).length,
        neverPaid:  list.filter(r => r.paidCount === 0).length,
    }
}
