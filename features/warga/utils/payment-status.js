export function getPaymentStatus(
    totalBayar,
    currentMonth
) {

    if (
        totalBayar >= currentMonth
    ) {
        return 'lunas'
    }

    if (
        totalBayar >= currentMonth - 2
    ) {
        return 'hampir-lunas'
    }

    if (totalBayar > 0) {
        return 'menunggak'
    }

    return 'belum-bayar'
}