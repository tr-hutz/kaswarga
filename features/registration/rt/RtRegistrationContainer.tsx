'use client'

import { useState }                                  from 'react'
import type { FormEvent }                            from 'react'
import { generateRtCode, submitRtRegistration }       from '@/lib/services/registration.service'
import RtRegistrationView                             from './RtRegistrationView'

const EMPTY = {
    name: '', code: '', address: '', city: '', province: '', postalCode: '',
    monthlyFee: '', bankName: '', accountNumber: '', accountHolder: '',
    chairmanName: '', chairmanEmail: '',
    adminName: '', adminEmail: '',
    treasurerName: '', treasurerEmail: ''
}

export default function RtRegistrationContainer() {

    const [form,       setForm]       = useState(EMPTY)
    const [generating, setGenerating] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error,      setError]      = useState('')
    const [success,    setSuccess]    = useState(false)

    function set(key: string, val: string) {
        setForm(prev => ({ ...prev, [key]: val }))
        setError('')
    }

    async function handleGenerateCode() {
        setGenerating(true)
        try {
            const code = await generateRtCode()
            set('code', code)
        } catch (err) {
            setError('Failed to generate code: ' + (err as Error).message)
        } finally {
            setGenerating(false)
        }
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError('')

        // Validate unique emails
        const emails = [form.chairmanEmail, form.adminEmail, form.treasurerEmail].filter(Boolean)
        const unique  = new Set(emails.map(e => e.toLowerCase()))
        if (unique.size !== emails.length) {
            setError('Chair, admin, and treasurer emails must all be different.')
            return
        }

        if (!form.code) {
            setError('RT code is required. Use the Generate button or fill it in manually.')
            return
        }

        setSubmitting(true)
        try {
            await submitRtRegistration({
                chairmanName:   form.chairmanName,
                chairmanEmail:  form.chairmanEmail,
                adminName:      form.adminName,
                adminEmail:     form.adminEmail,
                treasurerName:  form.treasurerName  || undefined,
                treasurerEmail: form.treasurerEmail || undefined,
                rtData: {
                    name:          form.name,
                    code:          form.code,
                    address:       form.address,
                    city:          form.city,
                    province:      form.province,
                    postalCode:    form.postalCode,
                    monthlyFee:    Number(form.monthlyFee) || 0,
                    bankName:      form.bankName,
                    accountNumber: form.accountNumber,
                    accountHolder: form.accountHolder
                }
            })
            setSuccess(true)
        } catch (err) {
            setError((err as Error).message || 'Failed to submit registration.')
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
            onGenerateCode={handleGenerateCode}
            onSubmit={handleSubmit}
        />
    )
}
