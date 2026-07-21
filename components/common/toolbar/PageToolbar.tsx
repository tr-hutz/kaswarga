'use client'

import Icon from '@/components/ui/Icon'
import { useTranslations } from 'next-intl'

import ToolbarSearch
    from './ToolbarSearch'

import ToolbarFilter
    from './ToolbarFilter'

import ToolbarExport
    from './ToolbarExport'

interface PageToolbarProps {
    title: string
    subtitle?: string
    onCreate?: () => void
    search?: string
    setSearch?: (v: string) => void
    searchPlaceholder?: string
    filterValue?: string
    setFilterValue?: (v: string) => void
    filterOptions?: { value: string; label: string }[]
    filterPlaceholder?: string
    onExportCSV?: () => void
    onExportExcel?: () => void
    onImport?: () => void
}

export default function PageToolbar({

                                        title,
                                        subtitle,
                                        onCreate,
                                        search,
                                        setSearch,
                                        searchPlaceholder =
                                        'Cari...',
                                        filterValue,
                                        setFilterValue,
                                        filterOptions = [],
                                        filterPlaceholder =
                                        'Filter',
                                        onExportCSV,
                                        onExportExcel,
                                        onImport

                                    }: PageToolbarProps) {

    const t = useTranslations('common')

    return (

        <div
            className="
                flex
                flex-col
                gap-4

                xl:flex-row
                xl:items-center
                xl:justify-between
            "
        >

            {/*
             |---------------------------------------------------------
             | LEFT
             |---------------------------------------------------------
             */}

            <div
                className="
                    flex
                    items-center
                    gap-3
                    min-w-0
                "
            >

                { onCreate !== undefined &&
                <button
                    aria-label={t('actions.add')}
                    onClick={onCreate}
                    className="
                        h-11
                        w-11
                        rounded-lg
                        bg-primary
                        text-white

                        flex
                        items-center
                        justify-center

                        hover:bg-primary-dark
                        transition

                        shrink-0
                    "
                >

                    <Icon name="plus" size={20} />

                </button> }

                <div
                    className="
                        min-w-0
                    "
                >

                    <div
                        className="
                            text-xl
                            font-bold
                            truncate
                            text-foreground
                        "
                    >
                        {title}
                    </div>

                    <div
                        className="
                            text-sm
                            text-muted
                            truncate
                        "
                    >
                        {subtitle}
                    </div>

                </div>

            </div>

            {/*
             |---------------------------------------------------------
             | RIGHT
             |---------------------------------------------------------
             */}

            <div
                className="
                    flex
                    flex-col
                    gap-3
                    w-full

                    sm:flex-row
                    sm:items-center

                    xl:w-auto
                "
            >

                {search !== undefined && setSearch !== undefined && (
                    <ToolbarSearch

                        value={search}
                        onChange={setSearch}
                        placeholder={searchPlaceholder}

                    />
                )}

                {
                    filterOptions.length > 0 && filterValue !== undefined && setFilterValue !== undefined && (

                        <ToolbarFilter

                            value={filterValue}
                            onChange={setFilterValue}
                            options={filterOptions}
                            placeholder={filterPlaceholder}

                        />
                    )
                }

                { onImport && (
                    <button
                        onClick={onImport}
                        className="
                            h-10
                            px-4
                            rounded-lg
                            border
                            border-divider
                            bg-surface
                            text-foreground
                            text-sm

                            flex
                            items-center
                            gap-2

                            hover:bg-canvas
                            transition
                        "
                    >
                        <Icon name="upload" size={16} />
                        <span>{t('actions.import')}</span>
                    </button>
                )}

                <ToolbarExport

                    onExportCSV={onExportCSV}
                    onExportExcel={onExportExcel}

                />

            </div>

        </div>
    )
}
