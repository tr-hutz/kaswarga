export function getMonthName(
  bulan,
  bulanList = []
) {

  const found =
    bulanList.find(
      item => item.id === bulan
    )

  return found?.nama || '-'
}

export function sortByMonth(
  data = []
) {

  return [...data]
    .sort(
      (a, b) =>
        a.bulan - b.bulan
    )
}