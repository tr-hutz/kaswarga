// @ts-nocheck
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