'use client'

import { type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
type Size    = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant
    size?: Size
    loading?: boolean
}

const VARIANT: Record<Variant, string> = {
    primary:   'bg-primary hover:bg-primary-dark text-white',
    secondary: 'bg-dark-4 hover:bg-dark-3 text-white',
    outline:   'border border-stroke text-dark hover:bg-body',
    danger:    'bg-danger hover:bg-danger/80 text-white',
    ghost:     'text-dark-5 hover:bg-body hover:text-dark',
}

const SIZE: Record<Size, string> = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
}

export default function Button({
    variant = 'primary', size = 'md', loading = false,
    disabled, className = '', children, ...props
}: Props) {
    return (
        <button
            disabled={disabled || loading}
            className={`
                inline-flex items-center justify-center gap-2 rounded-lg font-medium
                transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30
                disabled:opacity-50 disabled:cursor-not-allowed
                ${VARIANT[variant]} ${SIZE[size]} ${className}
            `}
            {...props}
        >
            {loading && (
                <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {children}
        </button>
    )
}
