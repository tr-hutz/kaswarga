'use client'

import SearchBox from './SearchBox'
import FilterBar from './FilterBar'

interface Props {
    search?: string
    searchPlaceholder?: string
    onSearch?: (value: string) => void
    renderFilters?: React.ReactNode
    renderActions?: React.ReactNode
}

export default function DataTableToolbar({
    search,
    searchPlaceholder,
    onSearch,
    renderFilters,
    renderActions,
}: Props) {
    return (
        <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
                {onSearch && (
                    <SearchBox
                        value={search}
                        onSearch={onSearch}
                        placeholder={searchPlaceholder}
                    />
                )}
                {renderFilters && (
                    <FilterBar>{renderFilters}</FilterBar>
                )}
            </div>
            {renderActions && (
                <div className="flex items-center gap-2">
                    {renderActions}
                </div>
            )}
        </div>
    )
}
