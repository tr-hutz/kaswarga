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
                    <label htmlFor={inputId} className="block text-sm font-medium text-dark">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={`
                        w-full h-10 px-3 rounded-lg border text-sm text-dark
                        bg-white placeholder:text-dark-6
                        focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30
                        disabled:bg-body disabled:text-dark-5 disabled:cursor-not-allowed
                        ${error ? 'border-danger' : 'border-stroke'}
                        ${className}
                    `}
                    {...props}
                />
                {error && <p className="text-xs text-danger">{error}</p>}
                {!error && hint && <p className="text-xs text-dark-5">{hint}</p>}
            </div>
        )
    }
)
Input.displayName = 'Input'
export default Input
