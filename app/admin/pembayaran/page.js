'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { getUserRole } from '../../../lib/getUserRole'

export default function Pembayaran() {
  useEffect(() => {
    checkAccess()
  }, [])

  const [wargaList, setWargaList] = useState([])
  const [wargaId, setWargaId] = useState('')
  const [jumlah, setJumlah] = useState('')
  const [bulan, setBulan] = useState('')

  const checkAccess = async () => {
    const role = await getUserRole()

    if (role !== 'admin') {
      alert('Akses ditolak')
      window.location.href = '/warga'
    }
  }

  const fetchWarga = async () => {
    const { data } = await supabase.from('warga').select('*')
    setWargaList(data)
  }

  const simpan = async () => {
    await supabase.from('pembayaran').insert({
      warga_id: wargaId,
      jumlah_bayar: parseInt(jumlah),
      jumlah_bulan: parseInt(bulan),
      tahun: new Date().getFullYear(),
      tanggal: new Date()
    })

    alert('Pembayaran tersimpan')
  }

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Input Pembayaran</h2>
      <button onClick={logout}>Logout</button>

      <select onChange={(e) => setWargaId(e.target.value)}>
        <option>Pilih Warga</option>
        {wargaList.map((w) => (
          <option key={w.id} value={w.id}>
            {w.nama} - {w.blok}
          </option>
        ))}
      </select>

      <br /><br />

      <input
        placeholder="Jumlah Bayar"
        onChange={(e) => setJumlah(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Jumlah Bulan"
        onChange={(e) => setBulan(e.target.value)}
      />

      <br /><br />

      <button onClick={simpan}>Simpan</button>
    </div>
  )
}