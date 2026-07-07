export function calculateArrears(
    paidCount,
    currentMonth
) {

    return Math.max(
        currentMonth - paidCount,
        0
    )
}