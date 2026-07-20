'use client'

import Icon from '@/components/ui/Icon'
import { formatRelativeDate } from '../../../lib/utils'

interface NotificationItemProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notification: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onClick?:     (n: any) => void
}

function getIconProps(type: string): { name: Parameters<typeof Icon>[0]['name']; color: string } {
    switch (type) {
        case 'payment_submitted':
            return { name: 'wallet',       color: 'text-primary' }
        case 'payment_approved':
            return { name: 'check-circle', color: 'text-success' }
        case 'payment_rejected':
            return { name: 'x-circle',     color: 'text-danger'  }
        case 'activity':
            return { name: 'activity',     color: 'text-warning' }
        default:
            return { name: 'bell',         color: 'text-muted'   }
    }
}

export default function NotificationItem({ notification, onClick }: NotificationItemProps) {

    const { name: iconName, color: iconColor } = getIconProps(notification.type)

    return (
        <button
            type="button"
            onClick={() => onClick?.(notification)}
            className={`
                w-full text-left px-4 py-3
                border-b border-divider last:border-b-0
                hover:bg-canvas transition-colors
                ${!notification.is_read ? 'bg-primary/5' : ''}
            `}
        >
            <div className="flex gap-3">

                <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                    <Icon name={iconName} size={18} />
                </div>

                <div className="flex-1 min-w-0">

                    <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-medium text-foreground truncate">
                            {notification.title}
                        </div>
                        {!notification.is_read && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                        )}
                    </div>

                    <div className="text-sm text-muted mt-0.5">
                        {notification.message}
                    </div>

                    <div className="text-xs text-subtle mt-1.5">
                        {formatRelativeDate(notification.created_at)}
                    </div>

                </div>

            </div>
        </button>
    )
}
