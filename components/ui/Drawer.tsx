'use client'

import { type ReactNode, useEffect } from 'react'
import Icon from '@/components/ui/Icon'

interface Props {
    open:     boolean
    title?:   string
    onClose:  () => void
    children: ReactNode
}

export default function Drawer({ open, title, onClose, children }: Props) {
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    return (
        <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
            <div
                className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />
            <div
                className={`absolute right-0 top-0 h-full w-full max-w-4xl bg-surface shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-divider shrink-0">
                        <h3 className="text-base font-semibold text-foreground">{title}</h3>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-md text-muted hover:text-foreground hover:bg-canvas"
                            aria-label="Close"
                        >
                            <Icon name="x" size={18} />
                        </button>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    )
}
