'use client'

import Icon from '@/components/ui/Icon'

interface Props {
    column: string
    currentSortBy?: string
    currentDirection?: 'asc' | 'desc'
    onSort: (sortBy: string, direction: 'asc' | 'desc') => void
    children: React.ReactNode
}

export default function SortButton({
    column,
    currentSortBy,
    currentDirection = 'asc',
    onSort,
    children,
}: Props) {
    const isActive = currentSortBy === column

    function handleClick() {
        if (isActive) {
            onSort(column, currentDirection === 'asc' ? 'desc' : 'asc')
        } else {
            onSort(column, 'asc')
        }
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            className="flex items-center gap-1 hover:text-dark transition-colors"
        >
            {children}
            <span className="flex flex-col -space-y-1">
                <Icon name="chevron-up"
                    className={`w-3 h-3 ${isActive && currentDirection === 'asc' ? 'text-dark' : 'text-stroke'}`}
                />
                <Icon name="chevron-down"
                    className={`w-3 h-3 ${isActive && currentDirection === 'desc' ? 'text-dark' : 'text-stroke'}`}
                />
            </span>
        </button>
    )
}
