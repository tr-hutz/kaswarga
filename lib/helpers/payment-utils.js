export function getMonthName(
  month,
  monthList = []
) {

  const found =
    monthList.find(
      item => item.id === month
    )

  return found?.name || '-'
}

export function sortByMonth(
  data = []
) {

  return [...data]
    .sort(
      (a, b) =>
        a.month - b.month
    )
}
