'use client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MonthlyCollectionChart({ data }: { data?: any }) {

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
        Collection
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