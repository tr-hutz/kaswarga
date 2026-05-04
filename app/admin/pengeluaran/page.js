'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function Pengeluaran() {
  const [kategori, setKategori] = useState('')
  const [nominal, setNominal] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [file, setFile] = useState(null)

  const uploadNota = async () => {
    if (!file) return null

    const fileName = `nota-${Date.now()}-${file.name}`

    const { data, error } = await supabase.storage
      .from('nota')
      .upload(fileName, file)

    if (error) {
      alert('Upload gagal')
      return null
    }

    return data.path
  }

  const simpan = async () => {
    const notaPath = await uploadNota()

    await supabase.from('pengeluaran').insert({
      tanggal: new Date(),
      kategori,
      nominal: parseInt(nominal),
      deskripsi,
      nota_url: notaPath
    })

    alert('Pengeluaran tersimpan')
  }

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Input Pengeluaran</h2>
      <button onClick={logout}>Logout</button>

      <input
        placeholder="Kategori (keamanan, kebersihan, dll)"
        onChange={(e) => setKategori(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Nominal"
        onChange={(e) => setNominal(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Deskripsi"
        onChange={(e) => setDeskripsi(e.target.value)}
      />

      <br /><br />

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br /><br />

      <button onClick={simpan}>Simpan</button>
    </div>
  )
}