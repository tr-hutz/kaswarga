'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations }                           from 'next-intl'
import Input                                         from '@/components/ui/Input'
import Select                                        from '@/components/ui/Select'
import Checkbox                                      from '@/components/ui/Checkbox'
import Button                                        from '@/components/ui/Button'
import Icon                                          from '@/components/ui/Icon'
import type { GuideAdminRow }                        from '@/lib/repositories/guide.repository'

const LOCALES = [
    { code: 'id', label: 'Bahasa Indonesia' },
    { code: 'en', label: 'English' },
] as const

const ROLE_OPTIONS = [
    { code: 'RT_CHAIR',  label: 'Ketua RT' },
    { code: 'RT_ADMIN',  label: 'Admin RT' },
    { code: 'TREASURER', label: 'Bendahara' },
    { code: 'RESIDENT',  label: 'Warga' },
]

export interface FormData {
    category:     string
    position:     number
    is_published: boolean
    target_roles: string[] | null
    locale:       string
    title:        string
    body:         string
}

interface Props {
    initial?:  GuideAdminRow
    saving:    boolean
    onSave:    (data: FormData) => void
    onCancel:  () => void
}

type WrapAction =
    | { type: 'wrap';  before: string; after: string; placeholder: string }
    | { type: 'line';  prefix: string }
    | { type: 'block'; text: string }

function applyAction(
    textarea: HTMLTextAreaElement,
    body:     string,
    action:   WrapAction,
    setBody:  (v: string) => void
) {
    const start = textarea.selectionStart
    const end   = textarea.selectionEnd
    let newBody: string, newStart: number, newEnd: number

    if (action.type === 'wrap') {
        const selected = body.slice(start, end) || action.placeholder
        const wrapped  = `${action.before}${selected}${action.after}`
        newBody  = body.slice(0, start) + wrapped + body.slice(end)
        newStart = start + action.before.length
        newEnd   = newStart + selected.length
    } else if (action.type === 'line') {
        const lineStart = body.lastIndexOf('\n', start - 1) + 1
        newBody  = body.slice(0, lineStart) + action.prefix + body.slice(lineStart)
        newStart = start + action.prefix.length
        newEnd   = end + action.prefix.length
    } else {
        const needsBefore = start > 0 && body[start - 1] !== '\n'
        const needsAfter  = end < body.length && body[end] !== '\n'
        const inserted    = `${needsBefore ? '\n' : ''}${action.text}${needsAfter ? '\n' : ''}`
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

const TOOLBAR: Array<{ title: string; icon: Parameters<typeof Icon>[0]['name']; action: WrapAction } | 'sep'> = [
    { title: 'Heading 1', icon: 'heading-1',   action: { type: 'line', prefix: '# ' } },
    { title: 'Heading 2', icon: 'heading-2',   action: { type: 'line', prefix: '## ' } },
    'sep',
    { title: 'Bold',      icon: 'bold',         action: { type: 'wrap', before: '**', after: '**', placeholder: 'teks tebal' } },
    { title: 'Italic',    icon: 'italic',       action: { type: 'wrap', before: '*',  after: '*',  placeholder: 'teks miring' } },
    'sep',
    { title: 'Bullet',    icon: 'list',         action: { type: 'line', prefix: '- ' } },
    { title: 'Numbered',  icon: 'list-ordered', action: { type: 'line', prefix: '1. ' } },
    'sep',
    { title: 'Link',      icon: 'link',         action: { type: 'wrap', before: '[', after: '](url)', placeholder: 'teks tautan' } },
    { title: 'Separator', icon: 'minus',        action: { type: 'block', text: '---' } },
]

export default function GuideSectionForm({ initial, saving, onSave, onCancel }: Props) {
    const t = useTranslations('guide')

    // Metadata
    const [category,    setCategory]    = useState(initial?.category      ?? 'general')
    const [position,    setPosition]    = useState(String(initial?.position ?? 0))
    const [isPublished, setIsPublished] = useState(initial?.is_published  ?? false)
    const [targetRoles, setTargetRoles] = useState<string[]>(initial?.target_roles ?? [])

    // Translation tabs: map of locale → {title, body}
    const initTrans = (): Record<string, { title: string; body: string }> => {
        const map: Record<string, { title: string; body: string }> = { id: { title: '', body: '' }, en: { title: '', body: '' } }
        if (initial?.translations) {
            for (const tr of initial.translations) {
                map[tr.locale] = { title: tr.title, body: tr.body }
            }
        }
        return map
    }
    const [translations, setTranslations] = useState<Record<string, { title: string; body: string }>>(initTrans)
    const [activeLocale, setActiveLocale] = useState<'id' | 'en'>('id')
    const [errors,       setErrors]       = useState<Partial<Record<'title', string>>>({})

    const taRef      = useRef<HTMLTextAreaElement>(null)
    const fileRef    = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        e.target.value = ''

        setUploading(true)
        try {
            const form = new FormData()
            form.append('file', file)
            const res = await fetch('/api/guide/upload', { method: 'POST', body: form })
            if (!res.ok) throw new Error(await res.text())
            const { url } = await res.json() as { url: string }
            const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
            const ta  = taRef.current
            if (!ta) return
            // Read current value from the DOM (controlled textarea — always matches state)
            const current = ta.value
            const pos     = ta.selectionStart ?? current.length
            const needsNL = pos > 0 && current[pos - 1] !== '\n'
            setCurrentBody(current.slice(0, pos) + (needsNL ? '\n' : '') + `![${alt}](${url})\n` + current.slice(pos))
        } catch (err) {
            console.error('[image upload]', err)
        } finally {
            setUploading(false)
        }
    }

    // Reset when initial changes (form reopened for a different row)
    useEffect(() => {
        setCategory(initial?.category      ?? 'general')
        setPosition(String(initial?.position ?? 0))
        setIsPublished(initial?.is_published ?? false)
        setTargetRoles(initial?.target_roles ?? [])
        setTranslations(initTrans())
        setActiveLocale('id')
        setErrors({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initial?.id])

    const currentTitle = translations[activeLocale]?.title ?? ''
    const currentBody  = translations[activeLocale]?.body  ?? ''

    function setCurrentTitle(v: string) {
        setTranslations(prev => ({ ...prev, [activeLocale]: { ...prev[activeLocale], title: v } }))
    }
    function setCurrentBody(v: string) {
        setTranslations(prev => ({ ...prev, [activeLocale]: { ...prev[activeLocale], body: v } }))
    }

    function toggleRole(code: string) {
        setTargetRoles(prev =>
            prev.includes(code) ? prev.filter(r => r !== code) : [...prev, code]
        )
    }

    function cmd(action: WrapAction) {
        const ta = taRef.current
        if (!ta) return
        applyAction(ta, currentBody, action, setCurrentBody)
    }

    const categoryOptions = [
        { value: 'quick_start', label: t('categories.quick_start') },
        { value: 'feature',     label: t('categories.feature') },
        { value: 'faq',         label: t('categories.faq') },
        { value: 'general',     label: t('categories.general') },
    ]

    function validate(): boolean {
        const e: typeof errors = {}
        if (!currentTitle.trim()) e.title = t('form.titleRequired')
        setErrors(e)
        return Object.keys(e).length === 0
    }

    function handleSubmit() {
        if (!validate()) return
        onSave({
            category,
            position:     Number(position) || 0,
            is_published: isPublished,
            target_roles: targetRoles.length > 0 ? targetRoles : null,
            locale:       activeLocale,
            title:        currentTitle.trim(),
            body:         currentBody.trim(),
        })
    }

    return (
        <div className="space-y-4">
            {/* Locale tabs */}
            <div>
                <p className="text-sm font-medium text-foreground mb-1.5">{t('form.locale')}</p>
                <div className="flex gap-1 p-1 rounded-lg bg-canvas border border-divider w-fit">
                    {LOCALES.map(loc => (
                        <button
                            key={loc.code}
                            type="button"
                            onClick={() => setActiveLocale(loc.code)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                activeLocale === loc.code
                                    ? 'bg-primary text-white'
                                    : 'text-muted hover:text-foreground'
                            }`}
                        >
                            {loc.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Title */}
            <Input
                label={t('form.title')}
                value={currentTitle}
                onChange={e => setCurrentTitle(e.target.value)}
                error={errors.title}
                required
            />

            {/* Markdown body editor */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                    {t('form.body')}
                </label>
                <div className="rounded-xl border border-divider overflow-hidden">
                    <div className="flex items-center gap-0.5 flex-wrap p-1.5 bg-surface border-b border-divider">
                        {TOOLBAR.map((item, i) =>
                            item === 'sep' ? (
                                <div key={i} className="w-px h-4 bg-divider mx-0.5" />
                            ) : (
                                <button
                                    key={item.title}
                                    type="button"
                                    title={item.title}
                                    disabled={saving || uploading}
                                    onClick={() => cmd(item.action)}
                                    className="p-1.5 rounded text-muted hover:text-foreground hover:bg-canvas transition-colors disabled:opacity-40"
                                >
                                    <Icon name={item.icon} size={14} />
                                </button>
                            )
                        )}
                        {/* Image upload */}
                        <div className="w-px h-4 bg-divider mx-0.5" />
                        <button
                            type="button"
                            title={t('form.uploadImage')}
                            disabled={saving || uploading}
                            onClick={() => fileRef.current?.click()}
                            className="p-1.5 rounded text-muted hover:text-foreground hover:bg-canvas transition-colors disabled:opacity-40"
                        >
                            {uploading
                                ? <Icon name="loader2" size={14} className="animate-spin" />
                                : <Icon name="image" size={14} />
                            }
                        </button>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                    </div>
                    <textarea
                        ref={taRef}
                        value={currentBody}
                        onChange={e => setCurrentBody(e.target.value)}
                        rows={14}
                        disabled={saving}
                        placeholder={t('form.bodyPlaceholder')}
                        className="w-full p-3 font-mono text-sm bg-surface text-foreground placeholder:text-muted resize-none outline-none disabled:opacity-60"
                    />
                </div>
                <p className="text-xs text-muted mt-1">{t('form.bodyHint')} {t('form.bodyHintImage')}</p>
            </div>

            {/* Metadata row */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Target roles */}
            <div>
                <p className="text-sm font-medium text-foreground mb-2">{t('form.targetRoles')}</p>
                <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={targetRoles.length === 0}
                            onChange={() => setTargetRoles([])}
                            className="rounded"
                        />
                        <span className="text-sm text-foreground">{t('form.targetRolesAll')}</span>
                    </label>
                    {ROLE_OPTIONS.map(role => (
                        <label key={role.code} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={targetRoles.includes(role.code)}
                                onChange={() => toggleRole(role.code)}
                                className="rounded"
                            />
                            <span className="text-sm text-foreground">{role.label}</span>
                        </label>
                    ))}
                </div>
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
