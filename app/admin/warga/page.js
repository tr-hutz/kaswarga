'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Input from '../../../components/Input'
import Button from '../../../components/Button'

export default function WargaPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [total, setTotal] = useState(0)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const [importing, setImporting] = useState(false)
  const [importMessage, setImportMessage] = useState('')

  const [form, setForm] = useState({
    nama: '',
    blok: '',
    no_rumah: '',
    email: ''
  })

  useEffect(() => {
    fetchWarga()
  }, [page, limit])

  const fetchWarga = async () => {
    setLoading(true)

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('warga')
      .select('*', { count: 'exact' })
      .order('blok', { ascending: true })
      .order('no_rumah', { ascending: true })
      .order('email', { ascending: true })
      .range(from, to)

    const { data, count } = await query

    setData(data || [])
    setTotal(count || 0)

    setLoading(false)
  }

  const totalPage = Math.ceil(total / limit)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const resetForm = () => {
    setForm({ nama: '', blok: '', no_rumah: '', email: '' })
    setEditing(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.nama || !form.blok || !form.no_rumah || !form.email) {
      alert('Semua field wajib diisi')
      return
    }

    const { data: existing } = await supabase
      .from('warga')
      .select('id')
      .eq('blok', form.blok)
      .eq('no_rumah', form.no_rumah)
      .eq('email', form.email)

    if (existing.length > 0 && (!editing || existing[0].id !== editing.id)) {
      alert('Blok & No Rumah sudah terdaftar')
      return
    }

    if (editing) {
      await supabase.from('warga').update(form).eq('id', editing.id)
    } else {
      await supabase.from('warga').insert([{ ...form }])
    }

    resetForm()
    fetchWarga()
  }

  const handleEdit = (row) => {
    setEditing(row)
    setForm(row)
    setShowForm(true)
  }

  const handleDelete = async (row) => {
    if (!confirm('Yakin hapus?')) return

    await supabase
      .from('warga')
      .delete()
      .eq('id', row.id)

    fetchWarga()
  }

  // ===== EXPORT CSV =====
  const exportCSV = () => {
    const rows = data.map(w => ({
      nama: w.nama,
      blok: w.blok,
      no_rumah: w.no_rumah,
      email: w.email
    }))

    const csv = [
      ['nama', 'blok', 'no_rumah', 'email'],
      ...rows.map(r => [r.nama, r.blok, r.no_rumah, r.email])
    ]
      .map(e => e.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'warga.csv'
    a.click()
  }

  // ===== IMPORT CSV =====
  const importCSV = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImporting(true)
    setImportMessage('Membaca file CSV...')

    try {
      const text = await file.text()

      const rows = text
        .split('\n')
        .map(r => r.trim())
        .filter(Boolean)

      if (rows.length <= 1) {
        alert('CSV kosong')
        return
      }

      const body = rows.slice(1)

      const inserts = []
      const seen = new Set()

      // ===== VALIDASI FILE =====
      setImportMessage('Validasi file...')

      for (let i = 0; i < body.length; i++) {
        const line = body[i]

        const [nama, blok, no_rumah, email] = line
          .split(',')
          .map(v => v?.trim())

        const rowNumber = i + 2

        if (!nama || !blok || !no_rumah || !email) {
          alert(`Baris ${rowNumber}: ada field kosong`)
          return
        }

        const key = `${blok}-${no_rumah}-${email}`

        if (seen.has(key)) {
          alert(`Baris ${rowNumber}: duplicate (${key})`)
          return
        }

        seen.add(key)

        inserts.push({
          nama,
          blok,
          no_rumah,
          email
        })
      }

      // ===== FETCH SEKALI =====
      setImportMessage('Memeriksa duplicate database...')

      const { data: existing } = await supabase
        .from('warga')
        .select('blok, no_rumah, email')

      const existingSet = new Set(
        (existing || []).map(
          x => `${x.blok}-${x.no_rumah}-${x.email}`
        )
      )

      const konflik = inserts.filter(x =>
        existingSet.has(`${x.blok}-${x.no_rumah}-${x.email}`)
      )

      if (konflik.length > 0) {
        alert(
          `Import dibatalkan.\nDuplicate ditemukan:\n` +
          konflik
            .map(x => `${x.blok}-${x.no_rumah}-${x.email}`)
            .join('\n')
        )
        return
      }

      // ===== BULK INSERT =====
      setImportMessage(`Mengimport ${inserts.length} data...`)

      const { error } = await supabase
        .from('warga')
        .insert(inserts)

      if (error) {
        alert('Import gagal')
        console.error(error)
        return
      }

      alert(`Berhasil import ${inserts.length} warga`)

      fetchWarga()

    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan saat import')
    } finally {
      setImporting(false)
      setImportMessage('')
      e.target.value = ''
    }
  }


  if (loading) return <p>Loading...</p>

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Data Warga</h1>

      {/* ACTION BAR */}
      <div className="flex gap-2 mb-3">
        <Input
          placeholder="Cari..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Button onClick={() => setShowForm(true)}>+ Tambah</Button>
        <Button onClick={exportCSV}>Export</Button>

        <label className="cursor-pointer">
          <span className="px-3 py-2 bg-gray-200 rounded">Import</span>
          <input type="file" hidden onChange={importCSV} />
        </label>

        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="border px-2"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {/* TABLE */}
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Nama</th>
            <th className="p-2 text-left">Blok</th>
            <th className="p-2 text-left">No Rumah</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-right">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {data
            .filter(w =>
              `${w.nama} ${w.blok} ${w.no_rumah}`
                .toLowerCase()
                .includes(search.toLowerCase())
            )
            .map(w => (
              <tr key={w.id} className="border-t">
                <td className="p-2">{w.nama}</td>
                <td className="p-2">{w.blok}</td>
                <td className="p-2">{w.no_rumah}</td>
                <td className="p-2">{w.email}</td>

                <td className="p-2 text-right">
                  <button onClick={() => handleEdit(w)}>Edit</button>{' '}
                  <button onClick={() => handleDelete(w)}>Hapus</button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* PAGINATION */}
      <div className="flex justify-between mt-3">
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
          Prev
        </button>

        <span>Page {page} / {totalPage}</span>

        <button disabled={page === totalPage} onClick={() => setPage(p => p + 1)}>
          Next
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-4 rounded w-80">
            <form onSubmit={handleSubmit} className="space-y-2">
              <Input name="nama" value={form.nama} onChange={handleChange} placeholder="Nama" />
              <Input name="blok" value={form.blok} onChange={handleChange} placeholder="Blok" />
              <Input name="no_rumah" value={form.no_rumah} onChange={handleChange} placeholder="No Rumah" />
              <Input name="email" value={form.email} onChange={handleChange} placeholder="Email" />

              <div className="flex justify-end gap-2">
                <Button type="button" onClick={resetForm}>Batal</Button>
                <Button type="submit">Simpan</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {importing && (<div className="mb-3 border rounded p-3 bg-blue-50"> <p className="text-sm font-medium"> {importMessage} </p> <div className="w-full bg-gray-200 rounded h-2 mt-2 overflow-hidden"> <div className="bg-blue-500 h-2 animate-pulse w-full" /> </div> </div>)}
    </div>
  )
}