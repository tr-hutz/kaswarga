'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { getUserRole } from '../../../lib/getUserRole'

export default function PembayaranPage() {
  const [wargaList, setWargaList] = useState([])
  const [wargaId, setWargaId] = useState('')
  const [selectedBulan, setSelectedBulan] = useState([])

  const bulanList = [
    { id: 1, nama: 'Jan' },
    { id: 2, nama: 'Feb' },
    { id: 3, nama: 'Mar' },
    { id: 4, nama: 'Apr' },
    { id: 5, nama: 'Mei' },
    { id: 6, nama: 'Jun' },
    { id: 7, nama: 'Jul' },
    { id: 8, nama: 'Agu' },
    { id: 9, nama: 'Sep' },
    { id: 10, nama: 'Okt' },
    { id: 11, nama: 'Nov' },
    { id: 12, nama: 'Des' }
  ]

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    await checkAccess()
    await fetchWargaList()
  }

  // 🔐 proteksi admin
  const checkAccess = async () => {
    const role = await getUserRole()
    if (role !== 'admin') {
      alert('Akses ditolak')
      window.location.href = '/warga'
    }
  }

  // 📥 ambil data warga
  const fetchWargaList = async () => {
    const { data, error } = await supabase
      .from('warga')
      .select('*')
      .order('nama', { ascending: true })

    console.log('WARGA DATA:', data)
    console.log('WARGA ERROR:', error)

    if (error) {
      alert('Gagal ambil data warga')
      return
    }

    setWargaList(data || [])
  }

  // 🔄 toggle bulan
  const toggleBulan = (id) => {
    if (selectedBulan.includes(id)) {
      setSelectedBulan(selectedBulan.filter(b => b !== id))
    } else {
      setSelectedBulan([...selectedBulan, id])
    }
  }

  // 💾 simpan pembayaran
  const simpan = async () => {
    console.log('WARGA ID:', wargaId)
    console.log('BULAN DIPILIH:', selectedBulan)

    // ✅ validasi
    if (!wargaId) {
      return alert('Pilih warga dulu')
    }

    if (selectedBulan.length === 0) {
      return alert('Pilih minimal 1 bulan')
    }

    const { data, error } = await supabase
      .from('pembayaran')
      .insert({
        warga_id: wargaId,
        jumlah_bayar: selectedBulan.length * 50000,
        jumlah_bulan: selectedBulan.length,
        bulan_dibayar: selectedBulan,
        tahun: new Date().getFullYear(),
        tanggal: new Date()
      })

    console.log('INSERT RESULT:', data)
    console.log('INSERT ERROR:', error)

    if (error) {
      alert(error.message)
      return
    }

    alert('Pembayaran berhasil disimpan')

    // reset
    setWargaId('')
    setSelectedBulan([])
  }

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Input Pembayaran</h2>
      <button onClick={logout}>Logout</button>

      {/* NAV */}
      <div style={{ marginBottom: 20 }}>
        <a href="/admin/dashboard">Dashboard</a> |{' '}
        <a href="/admin/pengeluaran">Pengeluaran</a>
      </div>

      {/* DROPDOWN WARGA */}
      <h3>Pilih Warga</h3>
      <select
        value={wargaId}
        onChange={(e) => setWargaId(e.target.value)}
      >
        <option value="">-- Pilih Warga --</option>

        {wargaList.map((w) => (
          <option key={w.id} value={w.id}>
            {w.nama} - {w.blok || '-'}
          </option>
        ))}
      </select>

      <br /><br />

      {/* PILIH BULAN */}
      <h3>Pilih Bulan</h3>

      {bulanList.map((b) => (
        <label key={b.id} style={{ display: 'block' }}>
          <input
            type="checkbox"
            checked={selectedBulan.includes(b.id)}
            onChange={() => toggleBulan(b.id)}
          />
          {b.nama}
        </label>
      ))}

      <br />

      {/* SUBMIT */}
      <button
        onClick={simpan}
        disabled={!wargaId || selectedBulan.length === 0}
      >
        Simpan
      </button>
    </div>
  )
}