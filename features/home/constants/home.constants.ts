export const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export const STATUS_STYLE = {

  approved:
    'bg-green-100 border-green-500 text-green-700',

  pending:
    'bg-yellow-100 border-yellow-500 text-yellow-700',

  rejected:
    'bg-red-100 border-red-500 text-red-700',

  unpaid:
    'bg-gray-100 border-gray-300 text-gray-700'
}
