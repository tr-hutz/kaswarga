'use client'

import { type InputHTMLAttributes } from 'react'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string
    error?: string
}

export default function Checkbox({ label, error, id, className = '', ...props }: Props) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
        <div className="space-y-1">
            <label htmlFor={inputId} className="inline-flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    id={inputId}
                    className={`h-4 w-4 rounded border-stroke text-primary accent-primary cursor-pointer ${className}`}
                    {...props}
                />
                {label && <span className="text-sm text-dark">{label}</span>}
            </label>
            {error && <p className="text-xs text-danger">{error}</p>}
        </div>
    )
}
