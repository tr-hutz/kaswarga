'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function Pembayaran() {
  const [wargaList, setWargaList] = useState([])
  const [wargaId, setWargaId] = useState('')
  const [jumlah, setJumlah] = useState('')
  const [bulan, setBulan] = useState('')

  useEffect(() => {
    fetchWarga()
  }, [])

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

  return (
    <div style={{ padding: 20 }}>
      <h2>Input Pembayaran</h2>

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