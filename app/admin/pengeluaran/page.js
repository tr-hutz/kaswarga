'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Card from '../../../components/Card'
import Input from '../../../components/Input'
import Button from '../../../components/Button'

export default function PengeluaranPage() {
  const [keterangan, setKeterangan] = useState('')
  const [jumlah, setJumlah] = useState('')

  const simpan = async () => {
    await supabase.from('pengeluaran').insert({
      keterangan,
      jumlah: parseInt(jumlah),
      tanggal: new Date()
    })

    alert('Berhasil')
    setKeterangan('')
    setJumlah('')
  }

  return (
    <Card>
      <h2 className="font-bold mb-3">Pengeluaran</h2>

      <Input
        placeholder="Keterangan"
        value={keterangan}
        onChange={(e) => setKeterangan(e.target.value)}
      />

      <Input
        type="number"
        placeholder="Jumlah"
        value={jumlah}
        onChange={(e) => setJumlah(e.target.value)}
      />

      <Button onClick={simpan} className="mt-3 w-full bg-red-500">
        Simpan
      </Button>
    </Card>
  )
}