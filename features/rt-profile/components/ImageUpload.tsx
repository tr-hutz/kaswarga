'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, MouseEvent } from 'react'
import Icon from '@/components/ui/Icon'
import { supabase } from '@/lib/supabase'
import { useTranslations } from 'next-intl'

const BUCKET = 'rt-assets'

interface ImageUploadProps {
    label:       string
    currentUrl?: string
    storagePath: string
    accept?:     string
    onUploaded:  (url: string) => void
}

export default function ImageUpload({ label, currentUrl, storagePath, accept = 'image/jpeg,image/png,image/webp', onUploaded }: ImageUploadProps) {

    const t = useTranslations('rtProfile.imageUpload')

    const [preview,   setPreview]   = useState(currentUrl || '')
    const [uploading, setUploading] = useState(false)
    const [error,     setError]     = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setPreview(currentUrl || '')
    }, [currentUrl])

    async function handleChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setError('')

        try {
            const ext  = (file.name.split('.').pop() ?? '').toLowerCase()
            const path = `${storagePath}.${ext}`

            const { error: uploadError } = await supabase.storage
                .from(BUCKET)
                .upload(path, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
            const url = `${data.publicUrl}?t=${Date.now()}`

            setPreview(url)
            onUploaded(url)
        } catch (err) {
            setError((err as Error).message || t('uploadFailed'))
        } finally {
            setUploading(false)
            // reset input so same file can be re-selected
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    function handleRemove(e: MouseEvent<HTMLButtonElement>) {
        e.stopPropagation()
        setPreview('')
        onUploaded('')
    }

    return (
        <div className="space-y-1.5">
            <label className="text-xs text-gray-500 block">{label}</label>

            <div
                onClick={() => !uploading && inputRef.current?.click()}
                className={`
                    relative flex flex-col items-center justify-center gap-2
                    border-2 border-dashed rounded-xl overflow-hidden
                    transition cursor-pointer select-none
                    ${uploading
                        ? 'border-gray-200 bg-gray-50 cursor-wait'
                        : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 bg-gray-50'
                    }
                    ${preview ? 'h-40' : 'h-32'}
                `}
            >
                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt={label}
                            className="h-full w-full object-contain p-2"
                        />
                        {!uploading && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="absolute top-2 right-2 bg-white border rounded-full p-0.5 text-gray-500 hover:text-red-500 shadow-sm"
                            >
                                <Icon name="x" size={14} />
                            </button>
                        )}
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition flex items-center justify-center opacity-0 hover:opacity-100">
                            <span className="text-xs text-white bg-black/60 rounded-lg px-2 py-1 flex items-center gap-1">
                                <Icon name="upload" size={11} /> {t('change')}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-1.5 text-gray-400 py-4">
                        <Icon name="image" size={28} strokeWidth={1.5} />
                        <p className="text-xs font-medium">{t('clickToUpload')}</p>
                        <p className="text-[11px]">{t('formatNote')}</p>
                    </div>
                )}

                {uploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Icon name="loader2" size={22} className="animate-spin text-blue-500" />
                    </div>
                )}
            </div>

            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={handleChange}
            />
        </div>
    )
}