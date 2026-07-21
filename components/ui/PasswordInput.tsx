'use client'

import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import Icon from './Icon'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export default function PasswordInput({ className = '', ...props }: Props) {
    const [visible, setVisible] = useState(false)

    return (
        <div className="relative">
            <input
                {...props}
                type={visible ? 'text' : 'password'}
                className={`w-full pr-10 ${className}`}
            />
            <button
                type="button"
                onClick={() => setVisible(v => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
            >
                <Icon name={visible ? 'eye-off' : 'eye'} size={16} />
            </button>
        </div>
    )
}
