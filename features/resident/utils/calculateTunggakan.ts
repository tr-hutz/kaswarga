export function calculateArrears(
    paidCount: number,
    currentMonth: number
) {

    return Math.max(
        currentMonth - paidCount,
        0
    )
}
