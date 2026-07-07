// @ts-nocheck
const STATUS_STYLE = {

  approved:
    'bg-green-100 border-green-500',

  pending:
    'bg-yellow-100 border-yellow-500',

  rejected:
    'bg-red-100 border-red-500',

  unpaid:
    'bg-gray-100 border-gray-300'
}

const STATUS_TEXT = {

  approved: 'Lunas',

  pending: 'Menunggu',

  rejected: 'Ditolak',

  unpaid: 'Belum Bayar'
}

export default function MonthCard({

  month,

  status

}) {

  const finalStatus =
    status || 'unpaid'

  return (

    <div
      className={`
        border-2
        rounded-xl
        p-4
        transition
        ${STATUS_STYLE[
        finalStatus
        ]}
      `}
    >

      <div
        className="
          font-semibold
          text-lg
        "
      >
        {month}
      </div>

      <div
        className="
          text-sm
          mt-2
        "
      >
        {
          STATUS_TEXT[
          finalStatus
          ]
        }
      </div>

    </div>
  )
}