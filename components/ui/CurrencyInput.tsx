'use client'

import { useState, useEffect, useRef } from 'react'

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
    value:    string | number
    onChange: (raw: string) => void
}

function toDisplay(raw: string | number): string {
    const digits = String(raw ?? '').replace(/\D/g, '')
    if (!digits) return ''
    return Number(digits).toLocaleString('id-ID')
}

export default function CurrencyInput({ value, onChange, className, ...props }: Props) {
    const [display, setDisplay] = useState(() => toDisplay(value))
    const externalRef = useRef(String(value ?? ''))

    useEffect(() => {
        const next = String(value ?? '')
        if (next !== externalRef.current) {
            externalRef.current = next
            setDisplay(toDisplay(next))
        }
    }, [value])

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const raw = e.target.value.replace(/\D/g, '')
        setDisplay(raw ? Number(raw).toLocaleString('id-ID') : '')
        onChange(raw)
    }

    return (
        <input
            {...props}
            type="text"
            inputMode="numeric"
            value={display}
            onChange={handleChange}
            className={className}
        />
    )
}
