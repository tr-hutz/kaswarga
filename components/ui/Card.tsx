import type { ReactNode } from 'react'

interface Props {
    children: ReactNode
    className?: string
    padding?: boolean
}

export default function Card({ children, className = '', padding = true }: Props) {
    return (
        <div className={`bg-surface rounded-lg shadow-card ${padding ? 'p-6' : ''} ${className}`}>
            {children}
        </div>
    )
}
