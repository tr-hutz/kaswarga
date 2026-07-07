interface MonthEntry {
  id: number
  name: string
  [key: string]: unknown
}

export function getMonthName(
  month: number,
  monthList: MonthEntry[] = []
): string {

  const found =
    monthList.find(
      item => item.id === month
    )

  return found?.name || '-'
}

export function sortByMonth<T extends { month: number }>(
  data: T[] = []
): T[] {

  return [...data]
    .sort(
      (a, b) =>
        a.month - b.month
    )
}
