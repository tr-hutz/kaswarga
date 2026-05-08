'use client'

import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'

import { supabase } from '../../../lib/supabase'
import { formatRupiah } from '../../../lib/utils'

import Input from '../../../components/Input'
import Button from '../../../components/Button'

const kategoriList = [
  'Kebersihan',
  'Keamanan',
  'Sosial',
  'Perbaikan',
  'Operasional',
  'Listrik',
  'Air',
  'Lainnya'
]

export default function PengeluaranPage() {

  const [data, setData] = useState([])

  const [loading, setLoading] =
    useState(true)

  const [search, setSearch] =
    useState('')

  const [page, setPage] =
    useState(1)

  const [limit, setLimit] =
    useState(10)

  const [total, setTotal] =
    useState(0)

  const [showForm, setShowForm] =
    useState(false)

  const [editingId, setEditingId] =
    useState(null)

  const [form, setForm] = useState({
    tanggal: new Date()
      .toISOString()
      .slice(0, 10),
    kategori: 'Operasional',
    deskripsi: '',
    nominal: ''
  })

  useEffect(() => {
    fetchData()
  }, [page, limit])

  // ===== FETCH =====
  const fetchData = async () => {

    setLoading(true)

    const from =
      (page - 1) * limit

    const to =
      from + limit - 1

    const { data, count } =
      await supabase
        .from('pengeluaran')
        .select('*', {
          count: 'exact'
        })
        .order('tanggal', {
          ascending: false
        })
        .range(from, to)

    setData(data || [])
    setTotal(count || 0)

    setLoading(false)
  }

  // ===== CHANGE =====
  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]:
        e.target.value
    })
  }

  // ===== SUBMIT =====
  const handleSubmit = async (e) => {

    e.preventDefault()

    if (
      !form.deskripsi ||
      !form.nominal
    ) {
      alert('Lengkapi data')
      return
    }

    const payload = {
      ...form,
      nominal:
        Number(form.nominal)
    }

    let error

    // EDIT
    if (editingId) {

      const result =
        await supabase
          .from('pengeluaran')
          .update(payload)
          .eq('id', editingId)

      error = result.error

    } else {

      // INSERT
      const result =
        await supabase
          .from('pengeluaran')
          .insert([payload])

      error = result.error
    }

    if (error) {
      console.error(error)
      alert('Gagal simpan')
      return
    }

    alert('Berhasil simpan')

    resetForm()

    fetchData()
  }

  // ===== DELETE =====
  const handleDelete =
    async (id) => {

      const ok = confirm(
        'Hapus data?'
      )

      if (!ok) return

      const { error } =
        await supabase
          .from('pengeluaran')
          .delete()
          .eq('id', id)

      if (error) {
        alert('Gagal hapus')
        return
      }

      fetchData()
    }

  // ===== EDIT =====
  const handleEdit = (row) => {

    setEditingId(row.id)

    setForm({
      tanggal: row.tanggal,
      kategori: row.kategori,
      deskripsi: row.deskripsi,
      nominal: row.nominal
    })

    setShowForm(true)
  }

  // ===== RESET =====
  const resetForm = () => {

    setEditingId(null)

    setForm({
      tanggal: new Date()
        .toISOString()
        .slice(0, 10),
      kategori: 'Operasional',
      deskripsi: '',
      nominal: ''
    })

    setShowForm(false)
  }

  // ===== FILTER =====
  const filtered = data.filter(x => {

    const keyword = `
      ${x.kategori}
      ${x.deskripsi}
    `
      .toLowerCase()

    return keyword.includes(
      search.toLowerCase()
    )
  })

  // ===== EXPORT CSV =====
  const exportCSV = () => {

    const header =
      'tanggal,kategori,deskripsi,nominal\n'

    const body =
      filtered.map(x =>
        [
          x.tanggal,
          x.kategori,
          x.deskripsi,
          x.nominal
        ].join(',')
      ).join('\n')

    const blob = new Blob(
      [header + body],
      { type: 'text/csv' }
    )

    const url =
      URL.createObjectURL(blob)

    const a =
      document.createElement('a')

    a.href = url
    a.download = 'pengeluaran.csv'

    a.click()
  }

  // ===== EXPORT EXCEL =====
  const exportExcel = () => {

    const rows = filtered.map(x => ({
      Tanggal: x.tanggal,
      Kategori: x.kategori,
      Deskripsi: x.deskripsi,
      Nominal: x.nominal
    }))

    const ws =
      XLSX.utils.json_to_sheet(rows)

    ws['!cols'] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 40 },
      { wch: 15 }
    ]

    const wb =
      XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      'Pengeluaran'
    )

    XLSX.writeFile(
      wb,
      'pengeluaran.xlsx'
    )
  }

  // ===== IMPORT CSV =====
  const importCSV =
    async (e) => {

      const file =
        e.target.files[0]

      if (!file) return

      const text =
        await file.text()

      const rows =
        text
          .split('\n')
          .slice(1)
          .map(r => {

            const [
              tanggal,
              kategori,
              deskripsi,
              nominal
            ] = r.split(',')

            return {
              tanggal,
              kategori,
              deskripsi,
              nominal:
                Number(nominal)
            }
          })

      const { error } =
        await supabase
          .from('pengeluaran')
          .insert(rows)

      if (error) {
        alert('Import gagal')
        return
      }

      alert('Import berhasil')

      fetchData()
    }

  // ===== IMPORT EXCEL =====
  const importExcel =
    async (e) => {

      const file =
        e.target.files[0]

      if (!file) return

      const buffer =
        await file.arrayBuffer()

      const workbook =
        XLSX.read(buffer, {
          type: 'array'
        })

      let inserts = []

      for (
        const sheetName
        of workbook.SheetNames
      ) {

        const sheet =
          workbook.Sheets[sheetName]

        const rows =
          XLSX.utils.sheet_to_json(
            sheet,
            {
              defval: ''
            }
          )

        inserts.push(
          ...rows.map(r => ({
            tanggal: r.tanggal,
            kategori: r.kategori,
            deskripsi: r.deskripsi,
            nominal:
              Number(r.nominal)
          }))
        )
      }

      const { error } =
        await supabase
          .from('pengeluaran')
          .insert(inserts)

      if (error) {
        alert('Import gagal')
        return
      }

      alert('Import berhasil')

      fetchData()
    }

  const totalPage =
    Math.ceil(total / limit)

  if (loading)
    return <p>Loading...</p>

  return (
    <div>

      {/* HEADER */}
      <div className="
        flex justify-between
        mb-4
      ">

        <h1 className="
          text-xl font-bold
        ">
          Pengeluaran
        </h1>

      </div>

      {/* ACTION */}
      <div className="
        flex gap-2 mb-4
        flex-wrap
      ">

        <Input
          placeholder="Cari..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

        <Button
          onClick={() =>
            setShowForm(true)
          }
        >
          + Tambah
        </Button>
        <Button
          onClick={exportCSV}
        >
          Export CSV
        </Button>

        <Button
          onClick={exportExcel}
        >
          Export Excel
        </Button>

        {/* IMPORT CSV */}
        <label className="
          cursor-pointer
        ">

          <span className="
            px-3 py-2
            bg-gray-200
            rounded text-sm
          ">
            Import CSV
          </span>

          <input
            hidden
            type="file"
            accept=".csv"
            onChange={importCSV}
          />

        </label>

        {/* IMPORT EXCEL */}
        <label className="
          cursor-pointer
        ">

          <span className="
            px-3 py-2
            bg-green-200
            rounded text-sm
          ">
            Import Excel
          </span>

          <input
            hidden
            type="file"
            accept=".xlsx,.xls"
            onChange={importExcel}
          />

        </label>

        {/* LIMIT */}
        <select
          value={limit}
          onChange={(e) =>
            setLimit(
              Number(
                e.target.value
              )
            )
          }
          className="
            border rounded
            px-2
          "
        >

          <option value={10}>
            10
          </option>

          <option value={25}>
            25
          </option>

          <option value={50}>
            50
          </option>

          <option value={100}>
            100
          </option>

        </select>

      </div>

      {/* TABLE */}
      <div className="
        border rounded
        overflow-auto
      ">

        <table className="
          w-full text-sm
        ">

          <thead className="
            bg-gray-100
          ">

            <tr>

              <th className="
                p-2 text-left
              ">
                Tanggal
              </th>

              <th className="
                p-2 text-left
              ">
                Kategori
              </th>

              <th className="
                p-2 text-left
              ">
                Deskripsi
              </th>

              <th className="
                p-2 text-right
              ">
                Nominal
              </th>

              <th className="
                p-2 text-right
              ">
                Aksi
              </th>

            </tr>

          </thead>

          <tbody>

            {filtered.map(x => (

              <tr
                key={x.id}
                className="
                  border-t
                "
              >

                <td className="p-2">
                  {x.tanggal}
                </td>

                <td className="p-2">
                  {x.kategori}
                </td>

                <td className="p-2">
                  {x.deskripsi}
                </td>

                <td className="
                  p-2 text-right
                ">

                  {formatRupiah(
                    x.nominal
                  )}

                </td>

                <td className="
                  p-2 text-center
                ">

                  <div className="
                    p-2 text-right
                  ">

                    <Button
                      onClick={() =>
                        handleEdit(x)
                      }
                    >
                      Edit
                    </Button>
                    {' '}
                    <Button
                      onClick={() =>
                        handleDelete(x.id)
                      }
                    >
                      Hapus
                    </Button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* PAGINATION */}
      <div className="
        flex justify-between
        mt-4
      ">

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
          disabled={
            page === totalPage
          }
          onClick={() =>
            setPage(p => p + 1)
          }
        >
          Next
        </button>

      </div>

      {/* MODAL */}
      {showForm && (

        <div className="
          fixed inset-0
          bg-black/30
          flex items-center
          justify-center
        ">

          <div className="
            bg-white
            p-4
            rounded
            w-[500px]
          ">

            <h2 className="
              font-bold mb-4
            ">

              {
                editingId
                  ? 'Edit'
                  : 'Tambah'
              } Pengeluaran

            </h2>

            <form
              onSubmit={handleSubmit}
              className="space-y-3"
            >

              <Input
                type="date"
                label="Tanggal"
                name="tanggal"
                value={form.tanggal}
                onChange={handleChange}
              />

              <div>

                <label className="
                  text-sm
                ">
                  Kategori
                </label>

                <select
                  name="kategori"
                  value={form.kategori}
                  onChange={handleChange}
                  className="
                    border rounded
                    w-full p-2
                  "
                >

                  {kategoriList.map(k => (

                    <option
                      key={k}
                      value={k}
                    >
                      {k}
                    </option>

                  ))}

                </select>

              </div>

              <Input
                label="Deskripsi"
                name="deskripsi"
                value={form.deskripsi}
                onChange={handleChange}
              />

              <Input
                type="number"
                label="Nominal"
                name="nominal"
                value={form.nominal}
                onChange={handleChange}
              />

              <div className="
                flex justify-end
                gap-2
              ">

                <Button
                  type="button"
                  onClick={resetForm}
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