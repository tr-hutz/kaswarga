'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Icon, { type IconName } from '@/components/ui/Icon'

interface NavItem {
    href: string
    icon: IconName
    label: string
}

export default function SidebarMenuItem({ item, active, badge = 0, onClick, compact = false }: {
    item: NavItem
    active: boolean
    badge?: number
    onClick?: () => void
    compact?: boolean
}) {
    const t = useTranslations('nav')
    return (
        <Link
            href={item.href}
            onClick={onClick}
            title={compact ? t(item.label) : undefined}
            className={`
                relative flex items-center rounded-lg transition-colors
                ${compact ? 'justify-center px-2 py-2.5' : 'gap-3 px-4 py-2.5'}
                ${active
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }
            `}
        >
            <Icon name={item.icon} size={18} className="shrink-0" />
            <span className={`flex-1 text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${compact ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                {t(item.label)}
            </span>
            {badge > 0 && !compact && (
                <span className="ml-auto bg-danger text-white text-xs font-medium rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
            {badge > 0 && compact && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-danger" />
            )}
        </Link>
    )
}
