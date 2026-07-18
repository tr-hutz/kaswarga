'use client'

import { useEffect, useRef, useState } from 'react'
import Icon from '@/components/ui/Icon'
import { useTranslations } from 'next-intl'

interface Props {
    value?: string
    onSearch: (value: string) => void
    placeholder?: string
    debounceMs?: number
}

export default function SearchBox({
    value = '',
    onSearch,
    placeholder,
    debounceMs = 300,
}: Props) {
    const t = useTranslations('dataTable')
    const [local, setLocal] = useState(value)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Keep local in sync when value changes externally (e.g. reset)
    useEffect(() => { setLocal(value) }, [value])

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const v = e.target.value
        setLocal(v)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => onSearch(v), debounceMs)
    }

    return (
        <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle pointer-events-none" />
            <input
                type="text"
                value={local}
                onChange={handleChange}
                placeholder={placeholder ?? t('searchPlaceholder')}
                className="
                    pl-9 pr-3 py-2
                    text-sm text-foreground border border-divider rounded-lg
                    bg-input placeholder:text-subtle
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                    w-64
                "
            />
        </div>
    )
}
