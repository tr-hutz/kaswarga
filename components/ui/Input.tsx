'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    hint?: string
}

const Input = forwardRef<HTMLInputElement, Props>(
    ({ label, error, hint, className = '', id, ...props }, ref) => {
        const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={`
                        w-full h-10 px-3 rounded-lg border text-sm text-foreground
                        bg-input placeholder:text-subtle
                        focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30
                        disabled:bg-canvas disabled:text-muted disabled:cursor-not-allowed
                        ${error ? 'border-danger' : 'border-divider'}
                        ${className}
                    `}
                    {...props}
                />
                {error && <p className="text-xs text-danger">{error}</p>}
                {!error && hint && <p className="text-xs text-muted">{hint}</p>}
            </div>
        )
    }
)
Input.displayName = 'Input'
export default Input
