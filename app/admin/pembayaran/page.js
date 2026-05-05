'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { getUserRole } from '../../../lib/getUserRole'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import Select from '../../../components/Select'
import { bulanList, formatRupiah } from '../../../lib/utils'

export default function PembayaranPage() {
  const [wargaList, setWargaList] = useState([])
  const [wargaId, setWargaId] = useState('')
  const [selectedBulan, setSelectedBulan] = useState([])

  useEffect(() => {
    // checkAccess()
    fetchWarga()
  }, [])

  const checkAccess = async () => {
    const user = await getUserRole()

    if (!user || user.role !== 'admin') {
      alert('Akses ditolak')
      window.location.href = '/warga'
    }
  }

  const fetchWarga = async () => {
    const { data } = await supabase.from('warga').select('*').order('nama')
    setWargaList(data || [])
  }

  const toggleBulan = (id) => {
    setSelectedBulan(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    )
  }

  const simpan = async () => {
    if (!wargaId || selectedBulan.length === 0) return

    await supabase.from('pembayaran').insert({
      warga_id: wargaId,
      jumlah_bayar: selectedBulan.length * 50000,
      jumlah_bulan: selectedBulan.length,
      bulan_dibayar: selectedBulan,
      tanggal: new Date()
    })

    alert('Berhasil')
    setSelectedBulan([])
    setWargaId('')
  }

  return (
    <Card>
      <h2 className="font-bold mb-3">Input Pembayaran</h2>

      <Select value={wargaId} onChange={(e) => setWargaId(e.target.value)}>
        <option value="">Pilih Warga</option>
        {wargaList.map(w => (
          <option key={w.id} value={w.id}>{w.nama}</option>
        ))}
      </Select>

      <div className="grid grid-cols-4 gap-2 mt-3">
        {bulanList.map(b => (
          <div
            key={b.id}
            onClick={() => toggleBulan(b.id)}
            className={`p-2 text-center border rounded cursor-pointer ${selectedBulan.includes(b.id) ? 'bg-green-200' : ''
              }`}
          >
            {b.nama}
          </div>
        ))}
      </div>

      <p className="mt-3">
        Total: Rp {formatRupiah(selectedBulan.length * 50000)}
      </p>

      <Button onClick={simpan} className="mt-3 w-full">
        Simpan
      </Button>
    </Card>
  )
}