/*
|------------------------------------------------------------------
| STATUS PEMBAYARAN
|------------------------------------------------------------------
*/

export function getPaymentStatus({

                                     totalBayar = 0,
                                     currentMonth = 0

                                 }) {

    if (
        totalBayar >= currentMonth
    ) {

        return 'Lunas'
    }

    if (
        totalBayar >= currentMonth - 2
    ) {

        return 'Hampir Lunas'
    }

    if (
        totalBayar > 0
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

export function calculateTunggakan({

                                       totalBayar = 0,
                                       currentMonth = 0

                                   }) {

    return Math.max(
        currentMonth -
        totalBayar,
        0
    )
}

/*
|------------------------------------------------------------------
| LABEL RUMAH
|------------------------------------------------------------------
*/

export function formatHouseLabel({

                                     blok,
                                     noRumah

                                 }) {

    return `${blok}-${noRumah}`
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