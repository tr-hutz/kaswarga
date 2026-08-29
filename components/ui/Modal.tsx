'use client'

import { type ReactNode, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { useKeyDown } from '@/lib/hooks/useKeyDown'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

interface Props {
    open: boolean
    title?: string
    onClose: () => void
    children: ReactNode
    size?: ModalSize
    className?: string
}

const SIZE: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
}

export default function Modal({ open, title, onClose, children, size = 'md', className = '' }: Props) {
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    useKeyDown(open, { Escape: onClose })

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
            <div role="dialog" aria-modal="true" className={`relative bg-surface rounded-xl shadow-default w-full ${SIZE[size]} ${className}`}>
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
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
                {children}
            </div>
        </div>
    )
}
