'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import { supabase } from '@/lib/supabase'

import Card from '@/components/Card'
import Button from '@/components/Button'

import {
  bulanList,
  formatRupiah
} from '@/lib/utils'

export default function BerandaPage() {

  // =========================
  // CONSTANT
  // =========================

  const currentYear =
    new Date().getFullYear()

  const currentMonth =
    new Date().getMonth() + 1

  const tahunOptions = [
    currentYear - 1,
    currentYear,
    currentYear + 1
  ]

  // =========================
  // REFS
  // =========================

  const fileInputRef =
    useRef(null)

  // =========================
  // STATE
  // =========================

  const [loading, setLoading] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [wargaId, setWargaId] =
    useState(null)

  const [profil, setProfil] =
    useState(null)

  // =========================
  // SUMMARY TAB
  // =========================

  const [
    summaryYear,
    setSummaryYear
  ] = useState(currentYear)

  const [
    summaryPaidMonths,
    setSummaryPaidMonths
  ] = useState([])

  const [
    summaryPendingMonths,
    setSummaryPendingMonths
  ] = useState([])

  const [
    summaryRejectedMonths,
    setSummaryRejectedMonths
  ] = useState([])

  // =========================
  // PAYMENT FORM
  // =========================

  const [
    paymentYear,
    setPaymentYear
  ] = useState(currentYear)

  const [
    paymentPaidMonths,
    setPaymentPaidMonths
  ] = useState([])

  const [
    paymentPendingMonths,
    setPaymentPendingMonths
  ] = useState([])

  const [
    paymentRejectedMonths,
    setPaymentRejectedMonths
  ] = useState([])

  // =========================
  // FORM
  // =========================

  const [fullYear, setFullYear] =
    useState(false)

  const [form, setForm] =
    useState({
      bulan_dibayar: [],
      bukti: null
    })

  // =========================
  // INIT
  // =========================

  useEffect(() => {
    init()
  }, [])

  const init = async () => {

    setLoading(true)

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) return

    // profil rt
    const { data: profilData } =
      await supabase
        .from('profil_rt')
        .select('*')
        .single()

    setProfil(profilData)

    // warga
    const { data: warga } =
      await supabase
        .from('warga')
        .select('id')
        .eq('email', user.email)
        .single()

    if (!warga) return

    setWargaId(warga.id)

    setLoading(false)
  }

  // =========================
  // FETCH SUMMARY
  // =========================

  useEffect(() => {

    if (!wargaId) return

    fetchSummaryPayments()
    fetchSummaryStatus()

  }, [
    summaryYear,
    wargaId
  ])

  const fetchSummaryPayments =
    async () => {

      const { data } =
        await supabase
          .from('pembayaran')
          .select('bulan_dibayar')
          .eq('warga_id', wargaId)
          .eq('tahun', summaryYear)

      const months =
        (data || [])
          .flatMap(
            x => x.bulan_dibayar || []
          )

      setSummaryPaidMonths(months)
    }

  const fetchSummaryStatus =
    async () => {

      const {
        data: konfirmasi
      } = await supabase
        .from('konfirmasi_pembayaran')
        .select(`
        bulan_dibayar,
        status
      `)
        .eq('warga_id', wargaId)
        .eq('tahun', summaryYear)

      const pending = []
      const rejected = []

        ; (konfirmasi || []).forEach(
          item => {

            if (
              item.status === 'pending'
            ) {
              pending.push(
                ...(item.bulan_dibayar || [])
              )
            }

            if (
              item.status === 'rejected'
            ) {
              rejected.push(
                ...(item.bulan_dibayar || [])
              )
            }
          }
        )

      setSummaryPendingMonths(
        pending
      )

      setSummaryRejectedMonths(
        rejected
      )
    }

  // =========================
  // FETCH PAYMENT STATUS
  // =========================

  useEffect(() => {

    if (!wargaId) return

    fetchPaymentStatus()

  }, [
    paymentYear,
    wargaId
  ])

  const fetchPaymentStatus =
    async () => {

      // approved
      const {
        data: pembayaran
      } = await supabase
        .from('pembayaran')
        .select('bulan_dibayar')
        .eq('warga_id', wargaId)
        .eq('tahun', paymentYear)

      const paid =
        (pembayaran || [])
          .flatMap(
            x => x.bulan_dibayar || []
          )

      setPaymentPaidMonths(paid)

      // pending / rejected
      const {
        data: konfirmasi
      } = await supabase
        .from('konfirmasi_pembayaran')
        .select(`
        bulan_dibayar,
        status
      `)
        .eq('warga_id', wargaId)
        .eq('tahun', paymentYear)

      const pending = []
      const rejected = []

        ; (konfirmasi || []).forEach(
          item => {

            if (
              item.status === 'pending'
            ) {
              pending.push(
                ...(item.bulan_dibayar || [])
              )
            }

            if (
              item.status === 'rejected'
            ) {
              rejected.push(
                ...(item.bulan_dibayar || [])
              )
            }
          }
        )

      setPaymentPendingMonths(
        pending
      )

      setPaymentRejectedMonths(
        rejected
      )
    }

  // =========================
  // SUMMARY
  // =========================

  const tunggakanMonths =
    useMemo(() => {

      if (
        summaryYear !== currentYear
      ) {
        return []
      }

      const result = []

      for (
        let i = 1;
        i <= currentMonth;
        i++
      ) {

        const paid =
          summaryPaidMonths.includes(i)

        const pending =
          summaryPendingMonths.includes(i)

        if (!paid && !pending) {
          result.push(i)
        }
      }

      return result

    }, [
      summaryPaidMonths,
      summaryPendingMonths,
      summaryYear
    ])

  const upcomingMonths =
    useMemo(() => {

      if (
        summaryYear !== currentYear
      ) {
        return []
      }

      const result = []

      for (
        let i = currentMonth + 1;
        i <= 12;
        i++
      ) {

        const paid =
          summaryPaidMonths.includes(i)

        const pending =
          summaryPendingMonths.includes(i)

        if (!paid && !pending) {
          result.push(i)
        }
      }

      return result

    }, [
      summaryPaidMonths,
      summaryPendingMonths,
      summaryYear
    ])

  // =========================
  // TOGGLE MONTH
  // =========================

  const toggleMonth = (id) => {

    // approved
    if (
      paymentPaidMonths.includes(id)
    ) {
      return
    }

    // pending
    if (
      paymentPendingMonths.includes(id)
    ) {
      return
    }

    const exists =
      form.bulan_dibayar.includes(id)

    if (exists) {

      setForm({
        ...form,
        bulan_dibayar:
          form.bulan_dibayar.filter(
            x => x !== id
          )
      })

    } else {

      setForm({
        ...form,
        bulan_dibayar: [
          ...form.bulan_dibayar,
          id
        ]
      })
    }
  }

  // =========================
  // FULL YEAR
  // =========================

  const toggleFullYear = () => {

    if (fullYear) {

      setForm({
        ...form,
        bulan_dibayar: []
      })

      setFullYear(false)

      return
    }

    const unpaidMonths =
      bulanList
        .map(b => b.id)
        .filter(id =>
          !paymentPaidMonths.includes(id)
        )
        .filter(id =>
          !paymentPendingMonths
            .includes(id)
        )

    setForm({
      ...form,
      bulan_dibayar: unpaidMonths
    })

    setFullYear(true)
  }

  // =========================
  // TOTAL
  // =========================

  const totalBayar =
    useMemo(() => {

      return (
        form.bulan_dibayar.length *
        (profil?.iuran_per_bulan || 0)
      )

    }, [
      form.bulan_dibayar,
      profil
    ])

  // =========================
  // FILE
  // =========================

  const handleFile = (e) => {

    const file =
      e.target.files[0]

    if (!file) return

    // size
    if (
      file.size > 5_000_000
    ) {
      alert(
        'Ukuran file maksimal 5MB'
      )
      return
    }

    // type
    const allowed = [
      'image/jpeg',
      'image/png',
      'application/pdf'
    ]

    if (
      !allowed.includes(file.type)
    ) {
      alert(
        'Format file tidak didukung'
      )
      return
    }

    setForm({
      ...form,
      bukti: file
    })
  }

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = async (e) => {

    e.preventDefault()

    if (
      form.bulan_dibayar.length === 0
    ) {
      alert('Pilih bulan')
      return
    }

    if (!form.bukti) {
      alert('Upload bukti')
      return
    }

    setSubmitting(true)

    // filename
    const fileName = `
      ${paymentYear}/
      ${wargaId}/
      ${Date.now()}-${form.bukti.name}
    `

    // upload
    const {
      error: uploadError
    } = await supabase.storage
      .from('bukti-pembayaran')
      .upload(
        fileName,
        form.bukti
      )

    if (uploadError) {

      console.error(uploadError)

      alert('Upload gagal')

      setSubmitting(false)

      return
    }

    // public url
    const {
      data: publicUrlData
    } = supabase.storage
      .from('bukti-pembayaran')
      .getPublicUrl(fileName)

    // insert
    const { error } =
      await supabase
        .from(
          'konfirmasi_pembayaran'
        )
        .insert([{
          warga_id: wargaId,
          tahun: paymentYear,
          bulan_dibayar:
            form.bulan_dibayar,
          jumlah_bulan: form.bulan_dibayar.length,
          jumlah_bayar: form.bulan_dibayar.length * profil?.iuran_per_bulan,
          bukti_url:
            publicUrlData.publicUrl,
          status: 'pending'
        }])

    setSubmitting(false)

    if (error) {

      console.error(error)

      alert(
        'Gagal mengirim pembayaran'
      )

      return
    }

    alert(
      'Konfirmasi pembayaran berhasil dikirim'
    )

    // refresh
    fetchPaymentStatus()
    fetchSummaryStatus()

    // reset
    setForm({
      bulan_dibayar: [],
      bukti: null
    })

    setFullYear(false)

    // reset native input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>

        <h1 className="
          text-2xl font-bold
        ">
          Beranda
        </h1>

        <p className="
          text-sm text-gray-500
        ">
          Ringkasan pembayaran warga
        </p>

      </div>

      {/* TABS */}
      <div className="
        flex gap-2 flex-wrap
      ">

        {tahunOptions.map(t => (

          <button
            key={t}
            onClick={() =>
              setSummaryYear(t)
            }
            className={`
              px-4 py-2 rounded-lg
              border text-sm transition

              ${summaryYear === t
                ? `
                    bg-blue-500
                    text-white
                    border-blue-500
                  `
                : `
                    bg-white
                  `
              }
            `}
          >

            {t}

          </button>

        ))}

      </div>

      {/* SUMMARY */}
      <div className="
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        gap-4
      ">

        {/* SUDAH BAYAR */}
        <Card>

          <p className="
            text-sm text-gray-500
          ">
            Sudah Dibayar
          </p>

          <h2 className="
            text-2xl font-bold mt-2
          ">

            {
              summaryPaidMonths.length
            } Bulan

          </h2>

          <p className="
            text-sm text-gray-500 mt-1
          ">

            {
              summaryPaidMonths
                .map(id =>
                  bulanList.find(
                    b => b.id === id
                  )?.nama
                )
                .join(', ') || '-'
            }

          </p>

        </Card>

        {/* TUNGGAKAN */}
        <Card>

          <p className="
            text-sm text-gray-500
          ">
            Tunggakan
          </p>

          <h2 className="
            text-2xl font-bold
            text-red-500 mt-2
          ">

            {
              tunggakanMonths.length
            } Bulan

          </h2>

          <p className="
            text-sm text-gray-500 mt-1
          ">

            {
              tunggakanMonths
                .map(id =>
                  bulanList.find(
                    b => b.id === id
                  )?.nama
                )
                .join(', ') || '-'
            }

          </p>

        </Card>

        {/* UPCOMING */}
        <Card>

          <p className="
            text-sm text-gray-500
          ">
            Bulan Akan Datang
          </p>

          <h2 className="
            text-2xl font-bold
            text-blue-500 mt-2
          ">

            {
              upcomingMonths.length
            } Bulan

          </h2>

          <p className="
            text-sm text-gray-500 mt-1
          ">

            {
              upcomingMonths
                .map(id =>
                  bulanList.find(
                    b => b.id === id
                  )?.nama
                )
                .join(', ') || '-'
            }

          </p>

        </Card>

      </div>

      {/* STATUS BULANAN */}
      <Card>

        <div className="mb-4">

          <h2 className="
            text-lg font-bold
          ">
            Status Bulanan
          </h2>

          <p className="
            text-sm text-gray-500
          ">
            Status pembayaran tahun{' '}
            {summaryYear}
          </p>

        </div>

        <div className="
          grid
          grid-cols-2
          sm:grid-cols-3
          md:grid-cols-4
          xl:grid-cols-6
          gap-3
        ">

          {bulanList.map(b => {

            const paid =
              summaryPaidMonths
                .includes(b.id)

            const pending =
              summaryPendingMonths
                .includes(b.id)

            const rejected =
              summaryRejectedMonths
                .includes(b.id)

            const overdue =
              summaryYear === currentYear &&
              b.id <= currentMonth &&
              !paid &&
              !pending

            return (

              <div
                key={b.id}
                className={`
                  rounded-xl
                  border p-4
                  text-center

                  ${paid
                    ? `
                        bg-green-50
                        border-green-300
                      `
                    : pending
                      ? `
                          bg-yellow-50
                          border-yellow-300
                        `
                      : rejected
                        ? `
                            bg-red-50
                            border-red-300
                          `
                        : overdue
                          ? `
                              bg-red-50
                              border-red-300
                            `
                          : `
                              bg-gray-50
                              border-gray-200
                            `
                  }
                `}
              >

                <div className="
                  text-sm text-gray-500
                ">
                  {b.nama}
                </div>

                <div className="
                  font-bold mt-2
                ">

                  {
                    paid
                      ? 'Lunas'
                      : pending
                        ? 'Menunggu'
                        : rejected
                          ? 'Ditolak'
                          : overdue
                            ? 'Tunggak'
                            : 'Belum'
                  }

                </div>

              </div>

            )
          })}

        </div>

      </Card>

      {/* FORM AJUKAN PEMBAYARAN */}
      <Card>

        <div className="mb-4">

          <h2 className="
      text-lg font-bold
    ">
            Ajukan Pembayaran
          </h2>

          <p className="
      text-sm text-gray-500
    ">
            Pilih bulan yang ingin dibayar
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* HEADER ACTION */}
          <div className="
      flex flex-col
      md:flex-row
      md:items-center
      md:justify-between
      gap-3
    ">

            {/* TAHUN */}
            <div>

              <label className="
          text-sm text-gray-500
        ">
                Periode Tahun
              </label>

              <select
                value={paymentYear}
                onChange={(e) =>
                  setPaymentYear(
                    Number(e.target.value)
                  )
                }
                className="
            border rounded-lg
            px-3 py-2
            w-full mt-1
          "
              >

                {tahunOptions.map(t => (

                  <option
                    key={t}
                    value={t}
                  >
                    {t}
                  </option>

                ))}

              </select>

            </div>

            {/* FULL YEAR */}
            <div>

              <label className="
          text-sm text-gray-500
        ">
                Pembayaran
              </label>

              <button
                type="button"
                onClick={toggleFullYear}
                className={`
            block mt-1
            px-4 py-2 rounded-lg
            border transition

            ${fullYear
                    ? `
                  bg-green-500
                  text-white
                  border-green-500
                `
                    : `
                  bg-white
                `
                  }
          `}
              >

                Disetahunkan

              </button>

            </div>

          </div>

          {/* BULAN */}
          <div>

            <label className="
        text-sm text-gray-500
      ">
              Pilih Bulan
            </label>

            <div className="
        grid
        grid-cols-2
        sm:grid-cols-3
        md:grid-cols-4
        xl:grid-cols-6
        gap-3 mt-3
      ">

              {bulanList.map(b => {

                const selected =
                  form.bulan_dibayar
                    .includes(b.id)

                const paid =
                  paymentPaidMonths
                    .includes(b.id)

                const pending =
                  paymentPendingMonths
                    .includes(b.id)

                const rejected =
                  paymentRejectedMonths
                    .includes(b.id)

                return (

                  <button
                    key={b.id}
                    type="button"
                    disabled={
                      paid || pending
                    }
                    onClick={() =>
                      toggleMonth(b.id)
                    }
                    className={`
                rounded-xl
                border p-3
                text-sm transition

                ${paid
                        ? `
                      bg-green-100
                      border-green-300
                      text-green-700
                      cursor-not-allowed
                    `
                        : pending
                          ? `
                        bg-yellow-100
                        border-yellow-300
                        text-yellow-700
                        cursor-not-allowed
                      `
                          : rejected
                            ? `
                          bg-red-100
                          border-red-300
                          text-red-700
                          hover:bg-red-50
                        `
                            : selected
                              ? `
                            bg-blue-500
                            text-white
                            border-blue-500
                          `
                              : `
                            bg-white
                            hover:bg-gray-50
                          `
                      }
              `}
                  >

                    {/* BULAN */}
                    <div>
                      {b.nama}
                    </div>

                    {/* STATUS */}
                    <div className="
                text-xs mt-1
              ">

                      {
                        paid
                          ? 'Lunas'
                          : pending
                            ? 'Menunggu'
                            : rejected
                              ? 'Ditolak'
                              : selected
                                ? 'Dipilih'
                                : 'Belum'
                      }

                    </div>

                  </button>

                )
              })}

            </div>

          </div>

          {/* TOTAL */}
          <div className="
      rounded-xl border
      bg-gray-50 p-4
    ">

            <div className="
        flex justify-between
        text-sm
      ">

              <span>
                Total Pembayaran
              </span>

              <strong>

                {
                  form.bulan_dibayar.length
                }
                {' '}bulan ×{' '}
                {
                  formatRupiah(
                    profil?.nominal_iuran || 0
                  )
                }

              </strong>

            </div>

            <div className="
        flex justify-between
        mt-2 font-bold
      ">

              <span>Total</span>

              <span>

                Rp {
                  formatRupiah(totalBayar)
                }

              </span>

            </div>

          </div>

          {/* FILE */}
          <div>

            <label className="
        text-sm text-gray-500
      ">
              Upload Bukti Pembayaran
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFile}
              className="
          border rounded-lg
          w-full p-2 mt-1
        "
            />

          </div>

          {/* ACTION */}
          <div className="
      flex justify-end
    ">

            <Button
              type="submit"
              disabled={submitting}
            >

              {
                submitting
                  ? 'Mengirim...'
                  : 'Ajukan Pembayaran'
              }

            </Button>

          </div>

        </form>

      </Card>

    </div>
  )
}