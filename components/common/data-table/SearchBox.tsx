'use client'

import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
                type="text"
                value={local}
                onChange={handleChange}
                placeholder={placeholder ?? t('searchPlaceholder')}
                className="
                    pl-9 pr-3 py-2
                    text-sm border border-gray-200 rounded-lg
                    bg-white placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400
                    w-64
                "
            />
        </div>
    )
}
