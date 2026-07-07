// @ts-nocheck
'use client'

export default function TunggakanBadge({

                                           total = 0

                                       }) {

    if (total <= 0) {

        return (

            <span
                className="
          px-3
          py-1
          rounded-full
          text-sm
          bg-emerald-100
          text-emerald-700
        "
            >
        Lunas
      </span>
        )
    }

    return (

        <span
            className="
        px-3
        py-1
        rounded-full
        text-sm
        bg-rose-100
        text-rose-700
      "
        >
      {total} bulan menunggak
    </span>
    )
}