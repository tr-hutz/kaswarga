export function buildExpenseAnalytics(

    rows = []

) {

    /*
     |-------------------------------------------------------------
     | TOTAL
     |-------------------------------------------------------------
     */

    const totalAmount =
        rows.reduce(

            (
                sum,
                item
            ) =>

                sum +
                Number(
                    item.amount || 0
                ),

            0
        )

    /*
     |-------------------------------------------------------------
     | CATEGORY MAP
     |-------------------------------------------------------------
     */

    const categoryMap = {}

    rows.forEach(item => {

        const category =
            item.category || '-'

        if (!categoryMap[category]) {

            categoryMap[category] = 0
        }

        categoryMap[category] +=
            Number(
                item.amount || 0
            )
    })

    /*
     |-------------------------------------------------------------
     | TOP CATEGORY
     |-------------------------------------------------------------
     */

    const topCategory =
        Object.entries(
            categoryMap
        )

            .sort(
                (a, b) =>
                    b[1] - a[1]
            )[0]

    /*
     |-------------------------------------------------------------
     | RETURN
     |-------------------------------------------------------------
     */

    return {

        totalAmount,

        totalCount:
        rows.length,

        categoryMap,

        topCategory
    }
}