/*
|------------------------------------------------------------------
| STATUS PEMBAYARAN
|------------------------------------------------------------------
*/

export function getPaymentStatus({
    paidCount = 0,
    currentMonth = 0
}: { paidCount?: number; currentMonth?: number } = {}) {

    if (
        paidCount >= currentMonth
    ) {

        return 'Lunas'
    }

    if (
        paidCount >= currentMonth - 2
    ) {

        return 'Hampir Lunas'
    }

    if (
        paidCount > 0
    ) {

        return 'Menunggak'
    }

    return 'Belum Bayar'
}

/*
|------------------------------------------------------------------
| TUNGGAKAN
|------------------------------------------------------------------
*/

export function calculateArrears({
    paidCount = 0,
    currentMonth = 0
}: { paidCount?: number; currentMonth?: number } = {}) {

    return Math.max(
        currentMonth -
        paidCount,
        0
    )
}

/*
|------------------------------------------------------------------
| LABEL RUMAH
|------------------------------------------------------------------
*/

export function formatHouseLabel({
    block,
    houseNumber
}: { block: string | null | undefined; houseNumber: string | null | undefined }) {

    return `${block}-${houseNumber}`
}

/*
|------------------------------------------------------------------
| NOMINAL
|------------------------------------------------------------------
*/

export function formatCurrency(
    value = 0
) {

    return Number(
        value
    ).toLocaleString(
        'id-ID'
    )
}
