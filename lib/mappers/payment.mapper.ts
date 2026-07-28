import { MONTHS } from '@/lib/constants/months'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatMonthIds(detail: any[] = []) {
    return detail
        .map(item => {
            const month = MONTHS.find(month => month.id === item.month)
            return month?.short || item.month
        })
        .join(', ')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatAddress(resident: any) {
    if (!resident) return '-'
    return [resident.block, resident.house_number].filter(Boolean).join(' - ')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateTotal(detail: any[] = []) {
    return detail.reduce((total, item) => total + (item.amount || 0), 0)
}

export function mapPayment(payments: unknown[] = []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (payments as any[]).map(item => ({
        id:           item.id,
        year:         item.year,
        date:         item.date,
        rt_id:        item.rt_id,
        resident_id:  item.resident_id,
        residentName: item.residents?.name || '-',
        address:      formatAddress(item.residents),
        monthLabel:   formatMonthIds(item.payment_details),
        total:        calculateTotal(item.payment_details),
        details:      item.payment_details || [],
        status:       'approved'
    }))
}

export function mapConfirmation(rows: unknown[] = []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (rows as any[])
        .filter(Boolean)
        .map(item => {
            const resident = Array.isArray(item.residents) ? item.residents[0] : item.residents
            const details = item?.confirmation_details || []
            const monthLabel = details
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((detail: any) => {
                    const month = MONTHS.find(m => Number(m.id) === Number(detail.month))
                    return month?.short
                })
                .filter(Boolean)
                .join(', ')

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const totalAmount = details.reduce((sum: any, detail: any) => sum + Number(detail.amount || 0), 0)

            return {
                id:          item.id,
                year:        item.year,
                status:      item.status,
                totalAmount: item.total_amount || totalAmount,
                createdAt:   item.created_at,
                proofUrl:    item.proof_url,
                name:        resident?.name || '-',
                block:       resident?.block || '-',
                houseNumber: resident?.house_number || '-',
                monthLabel,
                details
            }
        })
}
