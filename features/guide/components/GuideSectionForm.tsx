'use client'

import { useState, useRef } from 'react'
import { useTranslations }  from 'next-intl'
import Input                from '@/components/ui/Input'
import Select               from '@/components/ui/Select'
import Checkbox             from '@/components/ui/Checkbox'
import Button               from '@/components/ui/Button'
import Icon                 from '@/components/ui/Icon'
import type { GuideRow }    from '@/lib/repositories/guide.repository'

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

type WrapAction =
    | { type: 'wrap';   before: string; after: string; placeholder: string }
    | { type: 'line';   prefix: string }
    | { type: 'block';  text: string }

function applyAction(
    textarea: HTMLTextAreaElement,
    body: string,
    action: WrapAction,
    setBody: (v: string) => void
) {
    const start = textarea.selectionStart
    const end   = textarea.selectionEnd

    let newBody: string
    let newStart: number
    let newEnd: number

    if (action.type === 'wrap') {
        const selected   = body.slice(start, end) || action.placeholder
        const wrapped    = `${action.before}${selected}${action.after}`
        newBody          = body.slice(0, start) + wrapped + body.slice(end)
        newStart         = start + action.before.length
        newEnd           = newStart + selected.length
    } else if (action.type === 'line') {
        // Find the start of the current line
        const lineStart = body.lastIndexOf('\n', start - 1) + 1
        newBody  = body.slice(0, lineStart) + action.prefix + body.slice(lineStart)
        newStart = start + action.prefix.length
        newEnd   = end + action.prefix.length
    } else {
        // block: insert on a new line
        const needsNewlineBefore = start > 0 && body[start - 1] !== '\n'
        const needsNewlineAfter  = end < body.length && body[end] !== '\n'
        const prefix  = needsNewlineBefore ? '\n' : ''
        const suffix  = needsNewlineAfter  ? '\n' : ''
        const inserted = `${prefix}${action.text}${suffix}`
        newBody  = body.slice(0, start) + inserted + body.slice(end)
        newStart = start + inserted.length
        newEnd   = newStart
    }

    setBody(newBody)
    requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(newStart, newEnd)
    })
}

export default function GuideSectionForm({ initial, saving, onSave, onCancel }: Props) {
    const t = useTranslations('guide')

    const [title,       setTitle]       = useState(initial?.title        ?? '')
    const [body,        setBody]        = useState(initial?.body          ?? '')
    const [category,    setCategory]    = useState(initial?.category      ?? 'general')
    const [position,    setPosition]    = useState(String(initial?.position ?? 0))
    const [isPublished, setIsPublished] = useState(initial?.is_published  ?? false)
    const [errors,      setErrors]      = useState<Partial<Record<'title', string>>>({})

    const taRef = useRef<HTMLTextAreaElement>(null)

    const categoryOptions = [
        { value: 'quick_start', label: t('categories.quick_start') },
        { value: 'feature',     label: t('categories.feature') },
        { value: 'faq',         label: t('categories.faq') },
        { value: 'general',     label: t('categories.general') },
    ]

    function cmd(action: WrapAction) {
        const ta = taRef.current
        if (!ta) return
        applyAction(ta, body, action, setBody)
    }

    const TOOLBAR: Array<{ title: string; icon: Parameters<typeof Icon>[0]['name']; action: WrapAction } | 'sep'> = [
        { title: 'Heading 1', icon: 'heading-1',    action: { type: 'line',  prefix: '# ' } },
        { title: 'Heading 2', icon: 'heading-2',    action: { type: 'line',  prefix: '## ' } },
        'sep',
        { title: 'Bold',      icon: 'bold',          action: { type: 'wrap',  before: '**', after: '**', placeholder: 'teks tebal' } },
        { title: 'Italic',    icon: 'italic',        action: { type: 'wrap',  before: '*',  after: '*',  placeholder: 'teks miring' } },
        'sep',
        { title: 'Bullet',    icon: 'list',          action: { type: 'line',  prefix: '- ' } },
        { title: 'Numbered',  icon: 'list-ordered',  action: { type: 'line',  prefix: '1. ' } },
        'sep',
        { title: 'Link',      icon: 'link',          action: { type: 'wrap',  before: '[', after: '](url)', placeholder: 'teks tautan' } },
        { title: 'Separator', icon: 'minus',         action: { type: 'block', text: '---' } },
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
            position:     Number(position) || 0,
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

            {/* Markdown editor */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                    {t('form.body')}
                </label>
                <div className="rounded-xl border border-divider overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center gap-0.5 flex-wrap p-1.5 bg-surface border-b border-divider">
                        {TOOLBAR.map((item, i) =>
                            item === 'sep' ? (
                                <div key={i} className="w-px h-4 bg-divider mx-0.5" />
                            ) : (
                                <button
                                    key={item.title}
                                    type="button"
                                    title={item.title}
                                    disabled={saving}
                                    onClick={() => cmd(item.action)}
                                    className="p-1.5 rounded text-muted hover:text-foreground hover:bg-canvas transition-colors disabled:opacity-40"
                                >
                                    <Icon name={item.icon} size={14} />
                                </button>
                            )
                        )}
                    </div>
                    {/* Textarea */}
                    <textarea
                        ref={taRef}
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        rows={14}
                        disabled={saving}
                        placeholder={t('form.bodyPlaceholder')}
                        className="w-full p-3 font-mono text-sm bg-surface text-foreground placeholder:text-muted resize-none outline-none disabled:opacity-60"
                    />
                </div>
                <p className="text-xs text-muted mt-1">{t('form.bodyHint')}</p>
            </div>

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
