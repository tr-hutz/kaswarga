// @ts-nocheck
'use client'

export default function CashflowChart({

  data

}) {

  return (

    <div
      className="
        rounded-2xl
        border
        p-6
      "
    >

      <h2
        className="
          text-lg
          font-semibold
          mb-4
        "
      >
        Cashflow
      </h2>

      <pre>
        {
          JSON.stringify(
            data,
            null,
            2
          )
        }
      </pre>

    </div>
  )
}