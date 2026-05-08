'use client'

import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'

import { supabase } from '../../../lib/supabase'
import { bulanList, formatRupiah } from '../../../lib/utils'

import Input from '../../../components/Input'
import Button from '../../../components/Button'

export default function PembayaranPage() {

  const [data, setData] = useState([])
  const [wargaList, setWargaList] = useState([])

  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const [nominalIuran, setNominalIuran] = useState(0)

  const currentYear = new Date().getFullYear()

  const tahunOptions = [
    currentYear - 1,
    currentYear,
    currentYear + 1
  ]

  const [form, setForm] = useState({
    warga_id: '',
    bulan_dibayar: [],
    tahun: currentYear,
    tanggal: new Date()
      .toISOString()
      .slice(0, 10)
  })

  useEffect(() => {
    fetchData()
    fetchWarga()
    fetchProfil()
  }, [page, limit])

  // ===== FETCH PEMBAYARAN =====
  const fetchData = async () => {

    setLoading(true)

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, count } = await supabase
      .from('pembayaran')
      .select(`
        *,
        warga (
          nama,
          blok,
          no_rumah
        )
      `, { count: 'exact' })
      .order('tanggal', {
        ascending: false
      })
      .range(from, to)

    setData(data || [])
    setTotal(count || 0)

    setLoading(false)
  }

  // ===== FETCH WARGA =====
  const fetchWarga = async () => {

    const { data } = await supabase
      .from('warga')
      .select('*')
      .order('nama')

    setWargaList(data || [])
  }

  // ===== FETCH PROFIL =====
  const fetchProfil = async () => {

    const { data } = await supabase
      .from('profil_rt')
      .select('iuran_per_bulan')
      .limit(1)
      .single()

    setNominalIuran(
      data?.iuran_per_bulan || 0
    )
  }

  // ===== HANDLE CHANGE =====
  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  // ===== TOGGLE BULAN =====
  const toggleBulan = (id) => {

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

  // ===== TOTAL NOMINAL =====
  const totalBayar = useMemo(() => {
    return (
      form.bulan_dibayar.length *
      nominalIuran
    )

  }, [
    form.bulan_dibayar,
    nominalIuran
  ])

  // ===== SUBMIT =====
  const handleSubmit = async (e) => {

    e.preventDefault()

    if (
      !form.warga_id ||
      form.bulan_dibayar.length === 0
    ) {
      alert('Lengkapi data')
      return
    }

    // ===== VALIDASI DUPLICATE =====
    const { data: existing } =
      await supabase
        .from('pembayaran')
        .select(`
          bulan_dibayar,
          tahun
        `)
        .eq('warga_id', form.warga_id)
        .eq('tahun', form.tahun)

    const existingMonths =
      (existing || [])
        .flatMap(x => x.bulan_dibayar)

    const konflik =
      form.bulan_dibayar.filter(
        x => existingMonths.includes(x)
      )

    if (konflik.length > 0) {

      const namaBulan = konflik.map(id =>
        bulanList.find(
          b => b.id === id
        )?.nama
      )

      alert(
        `Bulan sudah dibayar:\n${namaBulan.join(', ')}`
      )

      return
    }

    // ===== INSERT =====
    const { error } = await supabase
      .from('pembayaran')
      .insert([{
        ...form,
        jumlah_bayar: totalBayar
      }])

    if (error) {
      console.error(error)
      alert('Gagal simpan')
      return
    }

    alert('Berhasil simpan')

    setShowForm(false)

    setForm({
      warga_id: '',
      bulan_dibayar: [],
      tahun: currentYear,
      tanggal: new Date()
        .toISOString()
        .slice(0, 10)
    })

    fetchData()
  }

  // ===== EXPORT EXCEL =====
  const exportExcel = () => {

    const rows = data.map(x => ({
      Nama: x.warga?.nama,
      Blok: x.warga?.blok,
      'Nomor Rumah': x.warga?.no_rumah,
      Bulan:
        x.bulan_dibayar
          ?.map(id =>
            bulanList.find(
              b => b.id === id
            )?.nama
          )
          .join(', '),
      Tahun: x.tahun,
      Nominal: x.jumlah_bayar,
      Tanggal: x.tanggal
    }))

    const ws =
      XLSX.utils.json_to_sheet(rows)

    const wb =
      XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      'Pembayaran'
    )

    XLSX.writeFile(
      wb,
      'pembayaran.xlsx'
    )
  }

  // ===== FILTERED =====
  const filtered = data.filter(x => {

    const keyword = `
      ${x.warga?.nama}
      ${x.warga?.blok}
      ${x.warga?.no_rumah}
    `
      .toLowerCase()

    return keyword.includes(
      search.toLowerCase()
    )
  })

  const totalPage =
    Math.ceil(total / limit)

  if (loading)
    return <p>Loading...</p>

  const handleEdit = (row) => {
    setEditing(row)
    setForm(row)
    setShowForm(true)
  }

  const handleDelete = async (row) => {
    if (!confirm('Yakin hapus?')) return

    await supabase
      .from('pembayaran')
      .delete()
      .eq('id', row.id)

    fetchData()
  }

  return (
    <div>

      <div className="flex justify-between mb-4">

        <h1 className="text-xl font-bold">
          Pembayaran
        </h1>

      </div>

      {/* ACTION */}
      <div className="flex gap-2 mb-4 flex-wrap">

        <Input
          placeholder="Cari..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <Button onClick={() => setShowForm(true)}>
          + Tambah
        </Button>
        <Button onClick={exportExcel}>
          Export Excel
        </Button>

        <select
          value={limit}
          onChange={(e) =>
            setLimit(
              Number(e.target.value)
            )
          }
          className="border rounded px-2"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>

      </div>

      {/* TABLE */}
      <div className="border rounded overflow-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-100">

            <tr>
              <th className="p-2 text-left">Warga</th>
              <th className="p-2 text-left">Bulan</th>
              <th className="p-2 text-left">Tahun</th>
              <th className="p-2 text-right">Nominal</th>
              <th className="p-2 text-left">Tanggal</th>
              <th className="p-2 text-right">Aksi</th>

            </tr>

          </thead>

          <tbody>

            {filtered.map(x => (

              <tr
                key={x.id}
                className="border-t"
              >

                <td className="p-2">

                  {x.warga?.nama}
                  <div className="text-xs text-gray-500">
                    {x.warga?.blok} -
                    {x.warga?.no_rumah}
                  </div>

                </td>

                <td className="p-2">

                  {x.bulan_dibayar
                    ?.map(id =>
                      bulanList.find(
                        b => b.id === id
                      )?.nama
                    )
                    .join(', ')}

                </td>

                <td className="p-2">
                  {x.tahun}
                </td>

                <td className="p-2 text-right">

                  {formatRupiah(
                    x.jumlah_bayar
                  )}

                </td>

                <td className="p-2">
                  {x.tanggal}
                </td>

                <td className="p-2 text-right">
                  <Button onClick={() => handleEdit(x)}>Edit</Button>{' '}
                  <Button onClick={() => handleDelete(x)}>Hapus</Button>
                </td>
              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* PAGINATION */}
      <div className="flex justify-between mt-4">

        <button
          disabled={page === 1}
          onClick={() =>
            setPage(p => p - 1)
          }
        >
          Prev
        </button>

        <div>
          Page {page} / {totalPage}
        </div>

        <button
          disabled={page === totalPage}
          onClick={() =>
            setPage(p => p + 1)
          }
        >
          Next
        </button>

      </div>

      {/* FORM MODAL */}
      {showForm && (

        <div className="
          fixed inset-0
          bg-black/30
          flex items-center justify-center
        ">

          <div className="
            bg-white
            p-4
            rounded
            w-[500px]
          ">

            <h2 className="font-bold mb-4">
              Tambah Pembayaran
            </h2>

            <form
              onSubmit={handleSubmit}
              className="space-y-3"
            >

              {/* WARGA */}
              <div>

                <label className="text-sm">
                  Warga
                </label>

                <select
                  name="warga_id"
                  value={form.warga_id}
                  onChange={handleChange}
                  className="
                    border rounded
                    w-full p-2
                  "
                >

                  <option value="">
                    Pilih warga
                  </option>

                  {wargaList.map(w => (

                    <option
                      key={w.id}
                      value={w.id}
                    >

                      {w.nama} —
                      {w.blok} /
                      {w.no_rumah}

                    </option>

                  ))}

                </select>

              </div>

              {/* BULAN */}
              <div>

                <label className="text-sm">
                  Bulan Dibayar
                </label>

                <div className="
                  grid grid-cols-4 gap-2 mt-2
                ">

                  {bulanList.map(b => {

                    const active =
                      form.bulan_dibayar
                        .includes(b.id)

                    return (

                      <button
                        type="button"
                        key={b.id}
                        onClick={() =>
                          toggleBulan(b.id)
                        }
                        className={`
                          border rounded p-2 text-sm
                          ${active
                            ? 'bg-blue-500 text-white'
                            : ''
                          }
                        `}
                      >

                        {b.nama}

                      </button>

                    )
                  })}

                </div>

              </div>

              {/* TAHUN */}
              <div>

                <label className="text-sm">
                  Tahun
                </label>

                <select
                  name="tahun"
                  value={form.tahun}
                  onChange={handleChange}
                  className="
                    border rounded
                    w-full p-2
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

              {/* TANGGAL */}
              <Input
                type="date"
                label="Tanggal Bayar"
                name="tanggar"
                value={form.tanggal}
                onChange={handleChange}
              />

              {/* TOTAL */}
              <div className="
                bg-gray-100
                rounded
                p-3
              ">

                <div className="
                  flex justify-between
                  text-sm
                ">

                  <span>
                    Total Bayar
                  </span>

                  <strong>
                    Rp {
                      formatRupiah(
                        totalBayar
                      )
                    }
                  </strong>

                </div>

              </div>

              {/* ACTION */}
              <div className="
                flex justify-end gap-2
              ">

                <Button
                  type="button"
                  onClick={() =>
                    setShowForm(false)
                  }
                >
                  Batal
                </Button>

                <Button type="submit">
                  Simpan
                </Button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  )
}