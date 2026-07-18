'use client'

import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: string
    hint?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, Props>(
    ({ label, error, hint, className = '', id, ...props }, ref) => {
        const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-medium text-dark">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={inputId}
                    className={`
                        w-full px-3 py-2 rounded-lg border text-sm text-dark
                        bg-white placeholder:text-dark-6 resize-y min-h-[80px]
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
Textarea.displayName = 'Textarea'
export default Textarea
