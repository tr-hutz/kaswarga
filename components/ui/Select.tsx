'use client'

import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react'
import Icon from './Icon'

interface Option {
    value: string
    label: string
    disabled?: boolean
}

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: string
    hint?: string
    options?: Option[]
    placeholder?: string
    children?: ReactNode
}

const Select = forwardRef<HTMLSelectElement, Props>(
    ({ label, error, hint, options = [], placeholder, className = '', id, children, ...props }, ref) => {
        const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        id={inputId}
                        className={`
                            w-full h-10 pl-3 pr-9 rounded-lg border text-sm text-foreground
                            bg-input appearance-none
                            focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30
                            disabled:bg-canvas disabled:text-muted disabled:cursor-not-allowed
                            ${error ? 'border-danger' : 'border-divider'}
                            ${className}
                        `}
                        {...props}
                    >
                        {placeholder && <option value="">{placeholder}</option>}
                        {options.map(opt => (
                            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                                {opt.label}
                            </option>
                        ))}
                        {children}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                        <Icon name="chevron-down" size={14} className="text-muted" />
                    </div>
                </div>
                {error && <p className="text-xs text-danger">{error}</p>}
                {!error && hint && <p className="text-xs text-muted">{hint}</p>}
            </div>
        )
    }
)
Select.displayName = 'Select'
export default Select
