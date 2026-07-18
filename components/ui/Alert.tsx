import type { ReactNode } from 'react'

type AlertType = 'success' | 'warning' | 'danger' | 'info'

interface Props {
    type?: AlertType
    title?: string
    children: ReactNode
    className?: string
}

const STYLES: Record<AlertType, string> = {
    success: 'border-success/30 bg-success/5 text-success',
    warning: 'border-warning/30 bg-warning/5 text-warning',
    danger:  'border-danger/30 bg-danger/5 text-danger',
    info:    'border-info/30 bg-info/5 text-info',
}

export default function Alert({ type = 'info', title, children, className = '' }: Props) {
    return (
        <div className={`rounded-lg border p-4 ${STYLES[type]} ${className}`}>
            {title && <p className="text-sm font-medium mb-1">{title}</p>}
            <div className="text-sm">{children}</div>
        </div>
    )
}
