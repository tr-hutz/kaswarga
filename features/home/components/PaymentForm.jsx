'use client'

import { useState }
  from 'react'

import { MONTHS } from '../../../constants/months'

export default function PaymentForm({

  paymentYear,

  setPaymentYear,

  onSubmit,

  loading,

  statusMap,

  nominalIuran

}) {

  const ALL_MONTHS =
      MONTHS.map(
          month => month.id
      )

  const PAYABLE_MONTHS =
      ALL_MONTHS.filter(
          id => {
              const s = statusMap?.[id]
              return s !== 'approved' && s !== 'pending'
          }
      )

  const [
    selectedMonths,
    setSelectedMonths
  ] = useState([])

  const [
    file,
    setFile
  ] = useState(null)

  /*
   |--------------------------------------------------------------------------
   | TOGGLE MONTH
   |--------------------------------------------------------------------------
   */

  function toggleMonth(
    bulan
  ) {

    const status =
      statusMap[bulan]

    /*
     * approved/pending
     * tidak bisa dipilih
     */
    if (
      status === 'approved'
      ||
      status === 'pending'
    ) {
      return
    }

    setSelectedMonths(
      prev => {

        if (
          prev.includes(
            bulan
          )
        ) {

          return prev.filter(
            item =>
              item !== bulan
          )
        }

        return [
          ...prev,
          bulan
        ]
      }
    )
  }

  /* =========================================================================
   TOGGLE SETAHUN
============================================================================= */

  function handleToggleFullYear() {

    /*
     |--------------------------------------------------------------------------
     | jika semua bulan sudah dipilih
     | -> reset semua
     |--------------------------------------------------------------------------
     */

    const isAllSelected =

        PAYABLE_MONTHS.length > 0 &&
        PAYABLE_MONTHS.every(
            month =>
                selectedMonths.includes(
                    month
                )
        )

    if (isAllSelected) {

      setSelectedMonths([])

      return
    }

    /*
     |--------------------------------------------------------------------------
     | jika belum lengkap
     | -> pilih semua yang bisa dibayar
     |--------------------------------------------------------------------------
     */

    setSelectedMonths(
        PAYABLE_MONTHS
    )
  }

  /* =========================================================================
     TOGGLE SINGLE MONTH
  ============================================================================= */

  function handleToggleMonth(
      monthId
  ) {

    setSelectedMonths(prev => {

      /*
       * remove
       */

      if (
          prev.includes(monthId)
      ) {

        return prev.filter(
            item =>
                item !== monthId
        )
      }

      /*
       * add
       */

      return [
        ...prev,
        monthId
      ]

    })
  }

  /*
   |--------------------------------------------------------------------------
   | SUMMARY
   |--------------------------------------------------------------------------
   */

  const totalBulan =
      selectedMonths.length

  const totalIuran =
      totalBulan *
      nominalIuran

  /*
   |--------------------------------------------------------------------------
   | SUBMIT
   |--------------------------------------------------------------------------
   */

  async function handleSubmit(
    e
  ) {

    e.preventDefault()

    await onSubmit({

      months:
        selectedMonths,

      year:
        paymentYear,

      file
    })

    /*
     * reset upload
     */
    setFile(null)
  }

  return (

    <form
      onSubmit={
        handleSubmit
      }
      className="
        border
        rounded-xl
        p-6
        space-y-6
      "
    >

      {/* HEADER */}

      <div
        className="
          flex
          flex-col
          md:flex-row
          gap-4
          md:items-center
          md:justify-between
        "
      >

        <h2
          className="
            text-xl
            font-semibold
          "
        >
          Ajukan Pembayaran
        </h2>

        <div
          className="
            flex
            flex-wrap
            items-center
            gap-3
          "
        >

          <select
            value={
              paymentYear
            }
            onChange={e =>
              setPaymentYear(
                Number(
                  e.target.value
                )
              )
            }
            className="
              border
              rounded-xl
              px-3
              py-2
            "
          >

            {[
              paymentYear - 1,
              paymentYear,
              paymentYear + 1
            ].map(year => (

              <option
                key={year}
                value={year}
              >
                {year}
              </option>

            ))}

          </select>

          <button
            type="button"
            onClick={
              handleToggleFullYear
            }
            className={`
      px-4
      py-2
      rounded-xl
      border
      transition-all

      ${
                PAYABLE_MONTHS.length > 0 &&
                PAYABLE_MONTHS.every(m => selectedMonths.includes(m))
                    ? `
            bg-blue-600
            text-white
            border-blue-600
          `
                    : `
            bg-white
            hover:bg-slate-100
          `
            }
    `}
          >
            Disetahunkan
          </button>

        </div>

      </div>

      {/* MONTHS */}

      <div
        className="
          grid
          grid-cols-2
          md:grid-cols-3
          xl:grid-cols-4
          gap-3
        "
      >

        {MONTHS.map(month => {

          const status =
              statusMap?.[month.id]

          const isDisabled =
              status === 'approved' ||
              status === 'pending'

          const isSelected =
              selectedMonths.includes(
                  month.id
              )

          return (

              <button
                  key={month.id}
                  type="button"
                  disabled={isDisabled}

                  onClick={() =>
                      handleToggleMonth(
                          month.id
                      )
                  }

                  className={`
          border
          rounded-2xl
          p-4
          text-left
          transition-all

          ${
                      isDisabled

                          ? `
                bg-slate-100
                text-slate-400
                border-slate-200
                cursor-not-allowed
              `

                          : isSelected

                          ? `
                bg-blue-600
                text-white
                border-blue-600
              `

                          : `
                bg-white
                hover:bg-slate-50
              `
                  }
        `}
              >

                <div
                    className="
            font-semibold
          "
                >
                  {month.short}
                </div>

                <div
                    className="
            text-sm
            opacity-80
          "
                >
                  {isDisabled
                      ? status === 'approved'
                          ? 'Lunas'
                          : 'Menunggu'
                      : `Rp ${nominalIuran?.toLocaleString('id-ID')}`
                  }
                </div>

              </button>

          )

        })}

      </div>

      {/*SUMMARY BOX*/}

      <div
          className="
    rounded-2xl
    border
    p-4
    bg-slate-50
    space-y-2
  "
      >

        <div
            className="
      flex
      items-center
      justify-between
    "
        >

    <span>
      Jumlah Bulan
    </span>

          <strong>
            {totalBulan}
            {' '}
            bulan
          </strong>

        </div>

        <div
            className="
      flex
      items-center
      justify-between
    "
        >

    <span>
      Total Iuran
    </span>

          <strong>
            Rp
            {' '}
            {totalIuran.toLocaleString(
                'id-ID'
            )}
          </strong>

        </div>

      </div>

      {/* FILE */}

      <div
        className="
          space-y-2
        "
      >

        <label
          className="
            text-sm
            font-medium
          "
        >
          Upload Bukti
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={e =>
            setFile(
              e.target.files?.[0]
            )
          }
        />

      </div>

      {/* ACTION */}

      <button
        type="submit"
        disabled={
          loading
          ||
          selectedMonths
            .length === 0
        }
        className="
          rounded-xl
          bg-black
          text-white
          px-6
          py-3
        "
      >

        {loading
          ? 'Mengirim...'
          : 'Ajukan Pembayaran'}

      </button>

    </form>
  )
}