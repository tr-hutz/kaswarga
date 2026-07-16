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
                flex
                items-center
                gap-3
                px-4
                py-3
                rounded-xl
                transition

                ${active
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'hover:bg-gray-100'
                }
            `}
        >
            <Icon name={item.icon} size={18} />

            <span className="flex-1">{t(item.label)}</span>

            {badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-medium rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
        </Link>
    )
}