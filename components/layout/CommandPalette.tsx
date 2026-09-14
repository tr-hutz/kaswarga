'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/lib/auth/useAuth'
import { NAVIGATION } from '@/lib/navigation/navigation-config'

interface Props {
    open:    boolean
    onClose: () => void
}

export default function CommandPalette({ open, onClose }: Props) {
    const t      = useTranslations('nav')
    const tPal   = useTranslations('commandPalette')
    const router = useRouter()
    const { permissions, membership } = useAuth()
    const isSuperAdmin = membership?.role === 'SUPER_ADMIN'

    const [query,    setQuery]    = useState('')
    const [selected, setSelected] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    const filteredItems = useMemo(() => {
        const q = query.trim().toLowerCase()
        return NAVIGATION.filter(item => {
            if (item.noRt      && !isSuperAdmin) return false
            if (item.requiresRt &&  isSuperAdmin) return false
            if (!item.permission) return true
            if (isSuperAdmin) return true
            return permissions.has(item.permission)
        }).filter(item => {
            if (!q) return true
            const label = t(item.label).toLowerCase()
            return label.includes(q) || item.href.toLowerCase().includes(q)
        })
    }, [query, isSuperAdmin, permissions, t])

    // Reset state when opening
    useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setQuery('')
            setSelected(0)
            setTimeout(() => inputRef.current?.focus(), 0)
        }
    }, [open])

    // Reset selected when results change
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { setSelected(0) }, [filteredItems.length])

    // Keyboard navigation
    useEffect(() => {
        if (!open) return
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                onClose()
            } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelected(s => Math.min(s + 1, filteredItems.length - 1))
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelected(s => Math.max(s - 1, 0))
            } else if (e.key === 'Enter') {
                const item = filteredItems[selected]
                if (item) { navigate(item.href) }
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, filteredItems, selected])

    function navigate(href: string) {
        router.push(href)
        onClose()
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

            {/* Palette box */}
            <div role="dialog" aria-modal="true" aria-label={tPal('label')}
                 className="relative w-full max-w-lg bg-surface rounded-xl shadow-default border border-divider overflow-hidden">

                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-divider">
                    <Icon name="search" size={18} className="text-muted shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={tPal('placeholder')}
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="text-muted hover:text-foreground">
                            <Icon name="x" size={16} />
                        </button>
                    )}
                    <kbd className="hidden sm:flex items-center text-xs text-muted border border-divider rounded px-1.5 py-0.5 font-mono">
                        Esc
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-72 overflow-y-auto py-2">
                    {filteredItems.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-muted text-center">{tPal('noResults')}</p>
                    ) : (
                        filteredItems.map((item, i) => (
                            <button
                                key={item.href}
                                onClick={() => navigate(item.href)}
                                onMouseEnter={() => setSelected(i)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                    i === selected
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-foreground hover:bg-canvas'
                                }`}
                            >
                                <Icon name={item.icon} size={16} className="shrink-0" />
                                <span className="flex-1 text-sm font-medium">{t(item.label)}</span>
                                <Icon name="arrow-right" size={14} className={`shrink-0 ${i === selected ? 'opacity-60' : 'opacity-0'}`} />
                            </button>
                        ))
                    )}
                </div>

                {/* Footer hint */}
                <div className="flex items-center gap-4 px-4 py-2 border-t border-divider text-xs text-muted">
                    <span className="flex items-center gap-1">
                        <kbd className="border border-divider rounded px-1 py-0.5 font-mono">↑↓</kbd>
                        {tPal('hintNavigate')}
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="border border-divider rounded px-1 py-0.5 font-mono">↵</kbd>
                        {tPal('hintOpen')}
                    </span>
                </div>
            </div>
        </div>
    )
}
