export default function PaymentSummary({

  summary

}) {

  return (

    <div
      className="
        grid
        grid-cols-3
        gap-4
      "
    >

      <div
        className="
          rounded-xl
          border
          p-4
        "
      >
        <div>
          Sudah Bayar
        </div>

        <div
          className="
            text-2xl
            font-bold
          "
        >
          {summary.paid}
        </div>
      </div>

      <div
        className="
          rounded-xl
          border
          p-4
        "
      >
        <div>
          Tunggakan
        </div>

        <div
          className="
            text-2xl
            font-bold
          "
        >
          {summary.tunggakan}
        </div>
      </div>

      <div
        className="
          rounded-xl
          border
          p-4
        "
      >
        <div>
          Upcoming
        </div>

        <div
          className="
            text-2xl
            font-bold
          "
        >
          {summary.upcoming}
        </div>
      </div>

    </div>
  )
}