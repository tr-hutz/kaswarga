'use client'

import { useState }                                  from 'react'
import { generateRtCode, submitRtRegistration }       from '@/lib/services/registration.service'
import RtRegistrationView                             from './RtRegistrationView'

const EMPTY = {
    nama: '', kode: '', nominalIuran: '', alamat: '', kota: '', provinsi: '',
    kodePos: '', telepon: '', email: '',
    namaBank: '', nomorRekening: '', atasNama: '',
    emailKetua: '', emailAdmin: '', emailBendahara: ''
}

export default function RtRegistrationContainer() {

    const [form,       setForm]       = useState(EMPTY)
    const [generating, setGenerating] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error,      setError]      = useState('')
    const [success,    setSuccess]    = useState(false)

    function set(key, val) {
        setForm(prev => ({ ...prev, [key]: val }))
        setError('')
    }

    async function handleGenerateKode() {
        setGenerating(true)
        try {
            const kode = await generateRtCode()
            set('kode', kode)
        } catch (err) {
            setError('Gagal generate kode: ' + err.message)
        } finally {
            setGenerating(false)
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')

        // Validate unique emails
        const emails = [form.emailKetua, form.emailAdmin, form.emailBendahara].filter(Boolean)
        const unique  = new Set(emails.map(e => e.toLowerCase()))
        if (unique.size !== emails.length) {
            setError('Email ketua, admin, dan bendahara harus berbeda satu sama lain.')
            return
        }

        if (!form.kode) {
            setError('Kode RT wajib diisi. Gunakan tombol Generate atau isi manual.')
            return
        }

        setSubmitting(true)
        try {
            await submitRtRegistration({
                nama:           form.nama,
                email:          form.emailKetua,
                emailKetua:     form.emailKetua,
                emailAdmin:     form.emailAdmin,
                emailBendahara: form.emailBendahara || null,
                rtData: {
                    nama:          form.nama,
                    kode:          form.kode,
                    nominalIuran:  Number(form.nominalIuran) || 0,
                    alamat:        form.alamat,
                    kota:          form.kota,
                    provinsi:      form.provinsi,
                    kodePos:       form.kodePos,
                    telepon:       form.telepon,
                    email:         form.email,
                    namaBank:      form.namaBank,
                    nomorRekening: form.nomorRekening,
                    atasNama:      form.atasNama
                }
            })
            setSuccess(true)
        } catch (err) {
            setError(err.message || 'Gagal mengirim pendaftaran.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <RtRegistrationView
            form={form}
            set={set}
            generating={generating}
            submitting={submitting}
            error={error}
            success={success}
            onGenerateKode={handleGenerateKode}
            onSubmit={handleSubmit}
        />
    )
}
