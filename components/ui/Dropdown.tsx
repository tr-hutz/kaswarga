'use client'

import { type ReactNode, useRef, useState, useEffect } from 'react'

interface DropdownItem {
    label: string
    onClick: () => void
    danger?: boolean
    icon?: ReactNode
}

interface Props {
    trigger: ReactNode
    items: DropdownItem[]
    align?: 'left' | 'right'
}

export default function Dropdown({ trigger, items, align = 'right' }: Props) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleOutside)
        return () => document.removeEventListener('mousedown', handleOutside)
    }, [])

    return (
        <div ref={ref} className="relative inline-block">
            <div onClick={() => setOpen(o => !o)}>{trigger}</div>
            {open && (
                <div className={`
                    absolute top-full mt-1 z-50 min-w-[160px] py-1
                    bg-white rounded-lg shadow-default border border-stroke
                    ${align === 'right' ? 'right-0' : 'left-0'}
                `}>
                    {items.map((item, i) => (
                        <button
                            key={i}
                            onClick={() => { item.onClick(); setOpen(false) }}
                            className={`
                                w-full flex items-center gap-2 px-4 py-2 text-sm text-left
                                hover:bg-body transition-colors
                                ${item.danger ? 'text-danger' : 'text-dark'}
                            `}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
