'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { bulanList, formatRupiah, logout } from '../../lib/utils'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Navbar from '../../components/Navbar'

export default function WargaPage() {
  const [warga, setWarga] = useState(null)
  const [pembayaran, setPembayaran] = useState([])
  const [requestList, setRequestList] = useState([])
  const [selectedBulan, setSelectedBulan] = useState([])

  const currentYear = new Date().getFullYear()
  const [tahun, setTahun] = useState(currentYear)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return

    fetchWarga(data.user.email)
  }

  const fetchWarga = async (email) => {
    const { data } = await supabase
      .from('warga')
      .select('*')
      .ilike('email', email)

    if (!data || data.length === 0) return

    const w = data[0]
    setWarga(w)

    fetchPembayaran(w.id)
    fetchRequest(w.id)
  }

  const fetchPembayaran = async (wargaId) => {
    const { data } = await supabase
      .from('pembayaran')
      .select('*')
      .eq('warga_id', wargaId)

    setPembayaran(data || [])
  }

  const totalBulan = pembayaran.reduce(
    (acc, p) => acc + (p.jumlah_bulan || 0),
    0
  )

  const totalBayar = pembayaran.reduce(
    (acc, p) => acc + (p.jumlah_bayar || 0),
    0
  )

  // ===================== LOGIC =====================

  const getStatusBulanan = () => {
    const paidMonths = [
      ...new Set(
        pembayaran.flatMap(p => p.bulan_dibayar || [])
      )
    ]

    return bulanList.map(b => ({
      ...b,
      isPaid: paidMonths.includes(b.id)
    }))
  }

  const getLastPaidMonth = () => {
    const allMonths = pembayaran.flatMap(p => p.bulan_dibayar || [])
    return allMonths.length ? Math.max(...allMonths) : null
  }

  const fetchRequest = async (wargaId) => {
    const { data } = await supabase
      .from('konfirmasi_pembayaran')
      .select('*')
      .eq('warga_id', wargaId)

    setRequestList(data || [])
  }

  // 🔒 anti double payment
  const getBlockedMonths = () => {
    const paid = pembayaran
      .filter(p => p.tahun === tahun)
      .flatMap(p => p.bulan_dibayar || [])

    const pending = requestList
      .filter(r => r.status === 'pending' && r.tahun === tahun)
      .flatMap(r => r.bulan_dibayar || [])

    return [...new Set([...paid, ...pending])]
  }

  const toggleBulan = (id) => {
    if (selectedBulan.includes(id)) {
      setSelectedBulan(selectedBulan.filter(b => b !== id))
    } else {
      setSelectedBulan([...selectedBulan, id])
    }
  }

  const status = totalBulan >= 12 ? 'LUNAS' : 'MENUNGGAK'
  const lastMonth = getLastPaidMonth()

  const requestPembayaran = async () => {
    if (selectedBulan.length === 0) return alert('Pilih bulan')

    const { error } = await supabase
      .from('konfirmasi_pembayaran')
      .insert({
        warga_id: warga.id,
        bulan_dibayar: selectedBulan,
        jumlah_bulan: selectedBulan.length,
        jumlah_bayar: selectedBulan.length * 50000,
        tahun
      })

    if (error) {
      alert(error.message)
      return
    }

    alert('Request dikirim')
    setSelectedBulan([])
    fetchRequest(warga.id)
  }

  const blockedMonths = getBlockedMonths()

  return (
    <div className="p-4 max-w-3xl mx-auto">

      <h2 className="text-xl font-bold mb-3">Halaman Warga</h2>

      {warga && (
        <p className="mb-3">
          {warga.nama} - {warga.blok}
        </p>
      )}

      {/* RINGKASAN */}
      <h3>Ringkasan</h3>
      <p>Total Bayar: Rp {formatRupiah(totalBayar)}</p>
      <p>Sudah Bayar: {totalBulan} bulan</p>
      <p>Tunggakan: {12 - totalBulan} bulan</p>

      <p>
        Status:
        <span style={{
          padding: '4px 10px',
          background: totalBulan >= 12 ? '#28a745' : '#dc3545',
          color: 'white',
          borderRadius: 6,
          marginLeft: 10
        }}>
          {status}
        </span>
      </p>

      {/* STATUS BULANAN */}
      <h3>Status Bulanan</h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
        gap: 10
      }}>
        {getStatusBulanan().map((b) => (
          <div
            key={b.id}
            style={{
              padding: 12,
              borderRadius: 10,
              background: b.isPaid
                ? (b.id === lastMonth ? '#a3e4b5' : '#d4edda')
                : '#f8d7da',
              border: b.id === lastMonth
                ? '2px solid #155724'
                : (b.isPaid ? '1px solid #28a745' : '1px solid #dc3545'),
              textAlign: 'center',
              fontWeight: 'bold',
              transition: '0.2s'
            }}
          >
            <div>{b.nama}</div>
            <div style={{ fontSize: 20 }}>
              {b.isPaid ? '✔️' : '❌'}
            </div>
          </div>
        ))}
      </div>

      <Card>
        <h3 className="font-bold mb-2">Ajukan Pembayaran</h3>

        {/* TAHUN */}
        <select
          value={tahun}
          onChange={(e) => setTahun(parseInt(e.target.value))}
          className="border p-2 rounded mb-3"
        >
          {[currentYear - 1, currentYear, currentYear + 1].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* BULAN */}
        <div className="grid grid-cols-4 gap-2">
          {bulanList.map(b => {
            const isBlocked = blockedMonths.includes(b.id)

            return (
              <div
                key={b.id}
                onClick={() => !isBlocked && toggleBulan(b.id)}
                className={`
                  p-2 text-center border rounded
                  ${isBlocked
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : selectedBulan.includes(b.id)
                      ? 'bg-green-200 cursor-pointer'
                      : 'bg-white cursor-pointer'
                  }
                `}
              >
                {b.nama}
              </div>
            )
          })}
        </div>

        <p className="mt-3">
          Total: Rp {formatRupiah(selectedBulan.length * 50000)}
        </p>

        <Button onClick={requestPembayaran} className="mt-3 w-full">
          Ajukan
        </Button>
      </Card>

    </div>
  )
}