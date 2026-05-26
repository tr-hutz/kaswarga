import {
  MONTHS
} from '../constants/home.constants'

export function buildMonthCards(
  statusMap = {}
) {

  return MONTHS.map(
    (
      month,
      index
    ) => {

      const bulan =
        index + 1

      return {

        bulan,

        label: month,

        status:
          statusMap[
          bulan
          ] || 'unpaid'

      }
    }
  )
}