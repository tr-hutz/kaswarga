// @ts-nocheck
'use client'

export default function TunggakanAlert({

                                           arrears = 0

                                       }) {

    if (arrears <= 0) {
        return null
    }

    return (

        <div
            className="
        bg-amber-50
        border
        border-amber-200
        text-amber-700
        rounded-2xl
        p-4
      "
        >

            Anda memiliki tunggakan
            sebanyak
            <strong>
                {' '}
                {arrears} bulan
            </strong>

        </div>
    )
}