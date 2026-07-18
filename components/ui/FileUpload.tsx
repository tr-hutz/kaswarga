'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { File, Loader2, Paperclip, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTranslations } from 'next-intl'

export default function FileUpload({ label, currentUrl, pathPrefix, accept, onUploaded, bucket = 'expense-receipts' }: {
    label?: string
    currentUrl?: string
    pathPrefix: string
    accept?: string
    onUploaded: (url: string) => void
    bucket?: string
}) {

    const t = useTranslations('fileUpload')

    const [fileLabel, setFileLabel] = useState(
        currentUrl
            ? decodeURIComponent((currentUrl.split('/').pop() ?? '').split('?')[0])
            : ''
    )
    const [uploading, setUploading] = useState(false)
    const [error,     setError]     = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    async function handleChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setError('')

        try {
            const ext  = (file.name.split('.').pop() ?? '').toLowerCase()
            const path = `${pathPrefix}/${Date.now()}.${ext}`

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(path, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data } = supabase.storage.from(bucket).getPublicUrl(path)

            setFileLabel(file.name)
            onUploaded(data.publicUrl)
        } catch (err) {
            setError((err as Error).message || t('uploadFailed'))
        } finally {
            setUploading(false)
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    function handleRemove() {
        setFileLabel('')
        onUploaded('')
    }

    return (
        <div className="space-y-1.5">

            {label && (
                <label className="text-sm font-medium text-dark block">
                    {label}
                </label>
            )}

            {fileLabel ? (
                <div className="flex items-center gap-2 border border-stroke rounded-lg px-3 py-2.5 bg-body">
                    <File size={15} className="text-dark-6 shrink-0" />
                    <span className="text-sm text-dark truncate flex-1">{fileLabel}</span>
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="text-dark-6 hover:text-danger shrink-0"
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => !uploading && inputRef.current?.click()}
                    className="
                        flex items-center gap-3 border-2 border-dashed border-stroke
                        rounded-lg px-4 py-3 cursor-pointer
                        hover:border-primary hover:bg-primary/5 transition
                    "
                >
                    {uploading
                        ? <Loader2 size={16} className="animate-spin text-primary shrink-0" />
                        : <Paperclip size={16} className="text-dark-6 shrink-0" />
                    }
                    <span className="text-sm text-dark-5">
                        {uploading ? t('uploading') : t('clickToAttach')}
                    </span>
                </div>
            )}

            {error && (
                <p className="text-xs text-danger">{error}</p>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={accept || 'image/jpeg,image/png,image/webp,application/pdf'}
                className="hidden"
                onChange={handleChange}
            />
        </div>
    )
}