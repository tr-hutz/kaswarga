'use client'

import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

export interface DangerDropdownItem {
    label:    string
    iconName: string
    onClick:  () => void
}

interface Props {
    label:     string
    items:     DangerDropdownItem[]
    disabled?: boolean
}

export default function DangerDropdown({ label, items, disabled }: Props) {
    const ref  = useRef<HTMLDivElement>(null)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (!open) return
        function onOutsideClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onOutsideClick)
        return () => document.removeEventListener('mousedown', onOutsideClick)
    }, [open])

    function pick(fn: () => void) { fn(); setOpen(false) }

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                disabled={disabled}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-danger/40 text-sm bg-danger text-white hover:bg-danger/90 transition disabled:opacity-60"
            >
                {label}
                <Icon name="chevron-down" size={14} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute left-0 top-full mt-1 z-20 min-w-[160px] rounded-lg border border-divider bg-surface shadow-default overflow-hidden">
                    {items.map(item => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => pick(item.onClick)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition text-left"
                        >
                            <Icon name={item.iconName as Parameters<typeof Icon>[0]['name']} size={15} />
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
