import {
  MONTHS
} from '../constants/home.constants'

export function buildMonthCards(
  statusMap: Record<number, string> = {}
) {

  return MONTHS.map(
    (
      _monthItem: number,
      index: number
    ) => {

      const month =
        index + 1

      return {

        month,

        label: month,

        status:
          statusMap[
          month
          ] || 'unpaid'

      }
    }
  )
}
