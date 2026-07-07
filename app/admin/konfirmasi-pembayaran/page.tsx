// @ts-nocheck
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import Toast from '../../../components/Toast'
import { formatRupiah } from '../../../lib/utils'
import useNotification from '../../../lib/useNotification'

export default function RequestPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRequest()

    const channel = supabase.channel('konfirmasi-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'konfirmasi_pembayaran'
      }, (payload) => {
        console.log('Realtime: ', payload)

        if (payload.eventType === 'INSERT') {
          show('Ada permintaan konfirmasi pembayaran baru')
        }

        // reload data
        fetchRequest()
      }).subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const { message, show } = useNotification()

  const fetchRequest = async () => {
    const { data, error } = await supabase
      .from('konfirmasi_pembayaran')
      .select('*, warga (nama, blok, no_rumah)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.log('ERROR fetching konfirmasi pembayaran')
      return
    }

    setData(data || [])
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const approve = async (req: any) => {
    setLoadingId(req.id)

    // get lock
    const { data: locked, error } = await supabase
      .from('konfirmasi_pembayaran')
      .update({ status: 'processing' })
      .eq('id', req.id)
      .eq('status', 'pending')
      .select()

    if (!locked || locked.length === 0) {
      alert('Konfirmasi sudah diproses admin/bendahara lain')
      return
    }

    // delay for simulation
    await new Promise(r => setTimeout(r, 2000))

    // insert 
    const { error: insertError } = await supabase.from('pembayaran').insert({
      warga_id: req.warga_id,
      jumlah_bayar: req.jumlah_bayar,
      jumlah_bulan: req.jumlah_bulan,
      bulan_dibayar: req.bulan_dibayar,
      tahun: req.tahun,
      tanggal: new Date().toISOString()
    })

    if (insertError) {
      console.log(insertError)

      // rollback status
      await supabase.from('konfirmasi_pembayaran')
        .update({ status: 'pending' })
        .eq('id', req.id)

      alert('Gagal approve')
      setLoadingId(null)
      return
    }

    // final status
    await supabase.from('konfirmasi_pembayaran')
      .update({ status: 'approved' })
      .eq('id', req.id)

    fetchRequest()
    setLoadingId(null)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reject = async (req: any) => {
    setLoadingId(req.id)
    // lock
    const { data: locked } = await supabase.from('konfirmasi_pembayaran')
      .update({ status: 'processing' })
      .eq('id', req.id)
      .eq('status', 'pending')
      .select()

    if (!locked || locked.length === 0) {
      alert('Sudah diproses admin/bendahara lain')
      setLoadingId(null)
      return
    }

    // reject
    await supabase
      .from('konfirmasi_pembayaran')
      .update({ status: 'rejected' })
      .eq('id', req.id)

    fetchRequest()
    setLoadingId(null)
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">

      <h2 className="text-xl font-bold mb-4">Approval Pembayaran</h2>

      <Toast message={message} />

      {data.length === 0 && <p>Tidak ada request</p>}

      {data.map(r => (
        <Card key={r.id}>
          <p><b>Warga:</b> {r.warga?.nama || '-'} | {r.warga?.blok || '-'} # {r.warga?.no_rumah || '-'}</p>
          <p><b>Tahun:</b> {r.tahun}</p>
          <p><b>Bulan:</b> {r.bulan_dibayar.join(', ')}</p>
          <p><b>Jumlah:</b> Rp {formatRupiah(r.jumlah_bayar)}</p>

          <div className="flex gap-2 mt-3">
            <Button
              disabled={loadingId === r.id && (<span className="text-xs text-blue-500 ml-2">
                Sedang diproses...
              </span>)}
              onClick={() => {
                approve(r)
              }}
            >
              Approve
            </Button>

            <Button
              disabled={loadingId === r.id && (<span className="text-xs text-blue-500 ml-2">
                Sedang diproses...
              </span>)}
              onClick={() => reject(r)}
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