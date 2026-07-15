'use client'

interface Props {
    children: React.ReactNode
}

/**
 * Layout wrapper for feature-specific filter controls.
 * Feature modules render their own filter components inside this slot.
 */
export default function FilterBar({ children }: Props) {
    return (
        <div className="flex items-center gap-2 flex-wrap">
            {children}
        </div>
    )
}
