'use client'

import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
    page: number
    totalPages: number
    total: number
    pageSize: number
    onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, total, pageSize, onPageChange }: Props) {
    const t = useTranslations('dataTable')

    const from  = Math.min((page - 1) * pageSize + 1, total)
    const to    = Math.min(page * pageSize, total)
    const pages = buildPageRange(page, totalPages)

    return (
        <div className="flex items-center justify-between text-sm text-gray-500 px-1">
            <span>
                {t('showing')} {from}–{to} {t('of')} {total} {t('records')}
            </span>

            <div className="flex items-center gap-1">
                <PageButton
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    aria-label={t('prev')}
                >
                    <ChevronLeft className="w-4 h-4" />
                </PageButton>

                {pages.map((p, i) =>
                    p === '...' ? (
                        <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
                    ) : (
                        <PageButton
                            key={p}
                            onClick={() => onPageChange(p as number)}
                            active={p === page}
                        >
                            {p}
                        </PageButton>
                    )
                )}

                <PageButton
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    aria-label={t('next')}
                >
                    <ChevronRight className="w-4 h-4" />
                </PageButton>
            </div>
        </div>
    )
}

function PageButton({
    children,
    onClick,
    disabled,
    active,
    ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`
                min-w-[32px] h-8 px-2 rounded-lg text-sm flex items-center justify-center transition
                ${active
                    ? 'bg-black text-white font-medium'
                    : 'hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed'
                }
            `}
            {...rest}
        >
            {children}
        </button>
    )
}

function buildPageRange(current: number, total: number): (number | '...')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

    const pages: (number | '...')[] = []

    pages.push(1)
    if (current > 3)              pages.push('...')
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
        pages.push(p)
    }
    if (current < total - 2)      pages.push('...')
    pages.push(total)

    return pages
}
