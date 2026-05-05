'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import { formatRupiah } from '../../../lib/utils'

export default function RequestPage() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetchRequest()
  }, [])

  const fetchRequest = async () => {
    const { data } = await supabase
      .from('konfirmasi_pembayaran')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    setData(data || [])
  }

  const approve = async (req) => {
    // insert ke pembayaran
    await supabase.from('pembayaran').insert({
      warga_id: req.warga_id,
      jumlah_bayar: req.jumlah_bayar,
      jumlah_bulan: req.jumlah_bulan,
      bulan_dibayar: req.bulan_dibayar,
      tahun: req.tahun,
      tanggal: new Date()
    })

    // update status
    await supabase
      .from('konfirmasi_pembayaran')
      .update({ status: 'approved' })
      .eq('id', req.id)

    fetchRequest()
  }

  const reject = async (id) => {
    await supabase
      .from('konfirmasi_pembayaran')
      .update({ status: 'rejected' })
      .eq('id', id)

    fetchRequest()
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">

      <h2 className="text-xl font-bold mb-4">Approval Pembayaran</h2>

      {data.length === 0 && <p>Tidak ada request</p>}

      {data.map(r => (
        <Card key={r.id}>
          <p><b>Warga ID:</b> {r.warga_id}</p>
          <p><b>Tahun:</b> {r.tahun}</p>
          <p><b>Bulan:</b> {r.bulan_dibayar.join(', ')}</p>
          <p><b>Jumlah:</b> Rp {formatRupiah(r.jumlah_bayar)}</p>

          <div className="flex gap-2 mt-3">
            <Button onClick={() => approve(r)}>
              Approve
            </Button>

            <Button
              onClick={() => reject(r.id)}
              className="bg-red-500"
            >
              Reject
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}