'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Input from '@/components/Input'
import Button from '@/components/Button'

export default function ProfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profilId, setProfilId] = useState(null)

  const [form, setForm] = useState({
    nama_perumahan: '',
    nama_rt: '',
    alamat: '',
    nominal_iuran: '',
    nama_ketua: '',
    nama_bendahara: '',
    nama_bank: '',
    nomor_rekening: '',
    nama_rekening: '',
    logo_url: ''
  })

  useEffect(() => {
    fetchProfil()
  }, [])

  const fetchProfil = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('profil_rt')
      .select('*')
      .limit(1)
      .single()

    if (data) {
      setProfilId(data.id)
      setForm(data)
    } else {
      // jika belum ada → create default
      const { data: newData } = await supabase
        .from('profil_rt')
        .insert([{ nama_perumahan: '', nama_rt: '' }])
        .select()
        .single()

      setProfilId(newData.id)
      setForm(newData)
    }

    setLoading(false)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleUploadLogo = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const fileName = `logo-${Date.now()}`

    const { error } = await supabase.storage
      .from('logo')
      .upload(fileName, file)

    if (error) {
      alert('Upload gagal')
      return
    }

    const { data } = supabase.storage
      .from('logo')
      .getPublicUrl(fileName)

    setForm({ ...form, logo_url: data.publicUrl })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.nama_perumahan) {
      alert('Nama perumahan wajib diisi')
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('profil_rt')
      .update(form)
      .eq('id', profilId)

    if (error) {
      alert('Gagal menyimpan')
    } else {
      alert('Berhasil disimpan')
    }

    setSaving(false)
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold mb-4">Profil RT</h1>

      <form onSubmit={handleSubmit} className="space-y-3">

        <Input
          label="Nama Perumahan"
          name="nama_perumahan"
          value={form.nama_perumahan}
          onChange={handleChange}
        />

        <Input
          label="Nama RT"
          name="nama_rt"
          value={form.nama_rt}
          onChange={handleChange}
        />

        <Input
          label="Alamat"
          name="alamat"
          value={form.alamat}
          onChange={handleChange}
        />

        <Input
          label="Iuran Per Bulan"
          name="iuranPerBulan"
          value={form.nominal_iuran}
          onChange={handleChange}
        />

        <Input
          label="Nama Ketua"
          name="nama_ketua"
          value={form.nama_ketua}
          onChange={handleChange}
        />

        <Input
          label="Nama Bendahara"
          name="nama_bendahara"
          value={form.nama_bendahara}
          onChange={handleChange}
        />

        <Input
          label="Nama Bank"
          name="nama_bank"
          value={form.nama_bank}
          onChange={handleChange}
        />

        <Input
          label="Nomor Rekening"
          name="nomor_rekening"
          value={form.nomor_rekening}
          onChange={handleChange}
        />

        <Input
          label="Nama Pemilik Rekening"
          name="nama_rekening"
          value={form.nama_rekening}
          onChange={handleChange}
        />

        {/* Upload Logo */}
        <div>
          <label className="block text-sm mb-1">Logo</label>
          <input type="file" onChange={handleUploadLogo} />

          {form.logo_url && (
            <img
              src={form.logo_url}
              alt="logo"
              className="mt-2 h-16"
            />
          )}
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan'}
        </Button>

      </form>
    </div>
  )
}