'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Icon, { type IconName } from '@/components/ui/Icon'

interface NavItem {
    href: string
    icon: IconName
    label: string
}

export default function SidebarMenuItem({ item, active, badge = 0, onClick }: {
    item: NavItem
    active: boolean
    badge?: number
    onClick?: () => void
}) {
    const t = useTranslations('nav')
    return (
        <Link
            href={item.href}
            onClick={onClick}
            className={`
                flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors
                ${active
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-dark-6 hover:bg-white/10 hover:text-white'
                }
            `}
        >
            <Icon name={item.icon} size={18} />
            <span className="flex-1 text-sm">{t(item.label)}</span>
            {badge > 0 && (
                <span className="ml-auto bg-danger text-white text-xs font-medium rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
        </Link>
    )
}
