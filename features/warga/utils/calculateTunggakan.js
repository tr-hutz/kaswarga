export function calculateTunggakan(
    totalBayar,
    currentMonth
) {

    return Math.max(
        currentMonth - totalBayar,
        0
    )
}