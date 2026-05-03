'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function Pembayaran() {
  const [warga, setWarga] = useState('')
  const [jumlah, setJumlah] = useState('')
  const [bulan, setBulan] = useState('')

  const simpan = async () => {
    await supabase.from('pembayaran').insert({
      warga_id: warga,
      jumlah_bayar: jumlah,
      jumlah_bulan: bulan,
      tahun: new Date().getFullYear(),
      tanggal: new Date()
    })
    alert('Tersimpan')
  }

  return (
    <div>
      <h2>Input Pembayaran</h2>
      <input placeholder="Warga ID" onChange={e => setWarga(e.target.value)} />
      <input placeholder="Jumlah Bayar" onChange={e => setJumlah(e.target.value)} />
      <input placeholder="Jumlah Bulan" onChange={e => setBulan(e.target.value)} />
      <button onClick={simpan}>Simpan</button>
    </div>
  )
}

const uploadNota = async (file) => {
  const { data } = await supabase.storage
    .from('nota')
    .upload(`nota-${Date.now()}`, file)

  return data.path
}