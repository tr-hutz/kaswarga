'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import Icon from './Icon'

interface Props {
    onExportExcel: () => void
    onExportCSV:   () => void
}

export default function ExportDropdown({ onExportExcel, onExportCSV }: Props) {
    const t   = useTranslations('common')
    const ref = useRef<HTMLDivElement>(null)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (!open) return
        function onOutsideClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', onOutsideClick)
        return () => document.removeEventListener('mousedown', onOutsideClick)
    }, [open])

    function pick(fn: () => void) {
        fn()
        setOpen(false)
    }

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-divider text-sm bg-surface hover:bg-canvas text-foreground transition"
            >
                <Icon name="download" size={15} />
                {t('actions.export')}
                <Icon
                    name="chevron-down"
                    size={14}
                    className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[150px] rounded-lg border border-divider bg-surface shadow-default overflow-hidden">
                    <button
                        type="button"
                        onClick={() => pick(onExportExcel)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-canvas transition text-left"
                    >
                        <Icon name="file-text" size={15} />
                        {t('actions.exportExcel')}
                    </button>
                    <button
                        type="button"
                        onClick={() => pick(onExportCSV)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-canvas transition text-left"
                    >
                        <Icon name="file-text" size={15} />
                        {t('actions.exportCsv')}
                    </button>
                </div>
            )}
        </div>
    )
}
