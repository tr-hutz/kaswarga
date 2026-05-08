'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

import Card from '../../components/Card'
import Button from '../../components/Button'

import {
  bulanList,
  formatRupiah
} from '../../lib/utils'

export default function BerandaPage() {

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
  // STATE
  // =========================

  const [loading, setLoading] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [user, setUser] =
    useState(null)

  const [wargaId, setWargaId] =
    useState(null)

  const [profil, setProfil] =
    useState(null)

  // ===== SUMMARY YEAR =====
  const [
    summaryYear,
    setSummaryYear
  ] = useState(currentYear)

  // ===== PAYMENT YEAR =====
  const [
    paymentYear,
    setPaymentYear
  ] = useState(currentYear)

  // ===== SUMMARY DATA =====
  const [
    summaryPaidMonths,
    setSummaryPaidMonths
  ] = useState([])

  // ===== PAYMENT DATA =====
  const [
    paymentPaidMonths,
    setPaymentPaidMonths
  ] = useState([])

  const [fullYear, setFullYear] =
    useState(false)

  const [form, setForm] = useState({
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

    // auth
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) return

    setUser(user)

    // profil
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

  }, [summaryYear, wargaId])

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

  // =========================
  // FETCH PAYMENT STATUS
  // =========================

  useEffect(() => {

    if (!wargaId) return

    fetchPaymentStatus()

  }, [paymentYear, wargaId])

  const fetchPaymentStatus =
    async () => {

      const { data } =
        await supabase
          .from('pembayaran')
          .select('bulan_dibayar')
          .eq('warga_id', wargaId)
          .eq('tahun', paymentYear)

      const months =
        (data || [])
          .flatMap(
            x => x.bulan_dibayar || []
          )

      setPaymentPaidMonths(months)
    }

  // =========================
  // SUMMARY
  // =========================

  const tunggakanMonths =
    useMemo(() => {

      // hanya hitung tahun berjalan
      if (summaryYear !== currentYear) {
        return []
      }

      const result = []

      for (
        let i = 1;
        i <= currentMonth;
        i++
      ) {

        if (
          !summaryPaidMonths.includes(i)
        ) {
          result.push(i)
        }
      }

      return result

    }, [
      summaryPaidMonths,
      summaryYear
    ])

  const upcomingMonths =
    useMemo(() => {

      // hanya tahun berjalan
      if (summaryYear !== currentYear) {
        return []
      }

      const result = []

      for (
        let i = currentMonth + 1;
        i <= 12;
        i++
      ) {

        if (
          !summaryPaidMonths.includes(i)
        ) {
          result.push(i)
        }
      }

      return result

    }, [
      summaryPaidMonths,
      summaryYear
    ])

  // =========================
  // TOGGLE MONTH
  // =========================

  const toggleMonth = (id) => {

    // sudah dibayar
    if (
      paymentPaidMonths.includes(id)
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

    // upload
    const fileName =
      `${paymentYear}/${wargaId}/${Date.now()}-${form.bukti.name}`

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

    // insert konfirmasi
    const { error } =
      await supabase
        .from(
          'konfirmasi_pembayaran'
        )
        .insert([{
          warga_id: wargaId,
          bulan_dibayar:
            form.bulan_dibayar,
          jumlah_bulan: form.bulan_dibayar.length,
          jumlah_bayar: form.bulan_dibayar.length * profil?.iuran_per_bulan,
          tahun: paymentYear,
          bukti_url:
            publicUrlData.publicUrl,
          status: 'pending'
        }])

    setSubmitting(false)

    if (error) {

      console.error(error)

      alert('Gagal submit')

      return
    }

    alert(
      'Konfirmasi pembayaran berhasil dikirim'
    )

    // reset
    setForm({
      bulan_dibayar: [],
      bukti: null
    })

    setFullYear(false)
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

      {/* TAHUN SUMMARY */}
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

            const overdue =
              summaryYear === currentYear &&
              b.id <= currentMonth &&
              !paid

            return (

              <div
                key={b.id}
                className={`
                  rounded-xl border p-4
                  text-center

                  ${paid
                    ? `
                        bg-green-50
                        border-green-300
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

      {/* FORM */}
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

          {/* ACTION HEADER */}
          <div className="
            flex flex-col
            md:flex-row
            md:items-center
            md:justify-between
            gap-3
          ">

            {/* PAYMENT YEAR */}
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
                    Number(
                      e.target.value
                    )
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

                return (

                  <button
                    key={b.id}
                    type="button"
                    disabled={paid}
                    onClick={() =>
                      toggleMonth(b.id)
                    }
                    className={`
                      rounded-xl border p-3
                      text-sm transition

                      ${paid
                        ? `
                            bg-green-100
                            border-green-300
                            text-green-700
                            cursor-not-allowed
                          `
                        : selected
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

                    {b.nama}

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
                    profil?.iuran_per_bulan || 0
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
                  formatRupiah(
                    totalBayar
                  )
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
              type="file"
              accept="image/*,.pdf"
              name="bukti-file"
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