import { formatMonths } from '@/lib/utils'

export interface ConfirmationEntry {
    id:          string
    year:        number
    status:      string
    totalAmount: number
    proofUrl:    string | null
    name:        string
    block:       string
    houseNumber: string
    months:      number[]
    details:     { id: string; month: number }[]
}

export interface ArrearRow {
    id:            string
    name:          string
    block:         string
    houseNumber:   string
    paidMonths:    number[]
    paidLabel:     string
    arrearMonths:  number[]
    arrearLabel:   string
    totalOwed:     number
    confirmations: ConfirmationEntry[]
}

export function buildArrearRows(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    residentAnalytics: any[],
    year:              number,
    monthlyFee:        number,
): ArrearRow[] {
    const now          = new Date()
    const currentYear  = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    // Months we expect payment for in this fiscal year
    const threshold =
        year < currentYear ? 12 :
        year > currentYear ? 0  :
        currentMonth

    return residentAnalytics
        .map(r => {
            const paidMonths: number[] = (r.paidMonths ?? []).map(Number).sort((a: number, b: number) => a - b)
            const expected             = Array.from({ length: threshold }, (_, i) => i + 1)
            const arrearMonths         = expected.filter(m => !paidMonths.includes(m))

            return {
                id:            r.id          as string,
                name:          r.name        as string,
                block:         r.block       as string,
                houseNumber:   r.houseNumber as string,
                paidMonths,
                paidLabel:     formatMonths(paidMonths),
                arrearMonths,
                arrearLabel:   formatMonths(arrearMonths),
                totalOwed:     arrearMonths.length * monthlyFee,
                confirmations: (r.confirmations ?? []) as ConfirmationEntry[],
            }
        })
        .filter(r => r.arrearMonths.length > 0)
        .sort((a, b) => b.arrearMonths.length - a.arrearMonths.length)
}
