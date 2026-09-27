'use client'

import { useState }       from 'react'
import { useTranslations } from 'next-intl'
import Input               from '@/components/ui/Input'
import Textarea            from '@/components/ui/Textarea'
import Select              from '@/components/ui/Select'
import Checkbox            from '@/components/ui/Checkbox'
import Button              from '@/components/ui/Button'
import type { GuideRow }   from '@/lib/repositories/guide.repository'

interface Props {
    initial?:  Partial<GuideRow>
    saving:    boolean
    onSave:    (data: FormData) => void
    onCancel:  () => void
}

export interface FormData {
    title:        string
    body:         string
    category:     string
    position:     number
    is_published: boolean
}

export default function GuideSectionForm({ initial, saving, onSave, onCancel }: Props) {
    const t = useTranslations('guide')

    const [title,        setTitle]        = useState(initial?.title        ?? '')
    const [body,         setBody]         = useState(initial?.body          ?? '')
    const [category,     setCategory]     = useState(initial?.category      ?? 'general')
    const [position,     setPosition]     = useState(String(initial?.position ?? 0))
    const [isPublished,  setIsPublished]  = useState(initial?.is_published  ?? false)
    const [errors,       setErrors]       = useState<Partial<Record<'title', string>>>({})

    const categoryOptions = [
        { value: 'quick_start', label: t('categories.quick_start') },
        { value: 'feature',     label: t('categories.feature') },
        { value: 'faq',         label: t('categories.faq') },
        { value: 'general',     label: t('categories.general') },
    ]

    function validate(): boolean {
        const e: typeof errors = {}
        if (!title.trim()) e.title = t('form.titleRequired')
        setErrors(e)
        return Object.keys(e).length === 0
    }

    function handleSubmit() {
        if (!validate()) return
        onSave({
            title,
            body,
            category,
            position: Number(position) || 0,
            is_published: isPublished,
        })
    }

    return (
        <div className="space-y-4">
            <Input
                label={t('form.title')}
                value={title}
                onChange={e => setTitle(e.target.value)}
                error={errors.title}
                required
            />
            <Select
                label={t('form.category')}
                value={category}
                onChange={e => setCategory(e.target.value)}
                options={categoryOptions}
            />
            <Input
                label={t('form.position')}
                type="number"
                value={position}
                onChange={e => setPosition(e.target.value)}
                min={0}
            />
            <Textarea
                label={t('form.body')}
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={12}
            />
            <Checkbox
                label={t('form.published')}
                checked={isPublished}
                onChange={e => setIsPublished(e.target.checked)}
            />
            <div className="flex items-center gap-2 pt-2">
                <Button onClick={handleSubmit} loading={saving}>
                    {t('form.save')}
                </Button>
                <Button variant="outline" onClick={onCancel} disabled={saving}>
                    {t('form.cancel')}
                </Button>
            </div>
        </div>
    )
}
