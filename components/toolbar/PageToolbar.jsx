'use client'

import { Plus, Upload } from 'lucide-react'

import ToolbarSearch
    from './ToolbarSearch'

import ToolbarFilter
    from './ToolbarFilter'

import ToolbarExport
    from './ToolbarExport'

export default function PageToolbar({

                                        /*
                                         |-------------------------------------------------------------
                                         | HEADER
                                         |-------------------------------------------------------------
                                         */

                                        title,
                                        subtitle,

                                        /*
                                         |-------------------------------------------------------------
                                         | CREATE
                                         |-------------------------------------------------------------
                                         */

                                        onCreate,

                                        /*
                                         |-------------------------------------------------------------
                                         | SEARCH
                                         |-------------------------------------------------------------
                                         */

                                        search,
                                        setSearch,

                                        searchPlaceholder =
                                        'Cari...',

                                        /*
                                         |-------------------------------------------------------------
                                         | FILTER
                                         |-------------------------------------------------------------
                                         */

                                        filterValue,
                                        setFilterValue,

                                        filterOptions = [],

                                        filterPlaceholder =
                                        'Filter',

                                        /*
                                         |-------------------------------------------------------------
                                         | EXPORT
                                         |-------------------------------------------------------------
                                         */

                                        onExportCSV,
                                        onExportExcel,

                                        onImport

                                    }) {

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
                    onClick={onCreate}
                    className="
                        h-11
                        w-11
                        rounded-2xl
                        bg-blue-600
                        text-white

                        flex
                        items-center
                        justify-center

                        hover:bg-blue-700
                        transition

                        shrink-0
                    "
                >

                    <Plus size={20} />

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
                        "
                    >
                        {title}
                    </div>

                    <div
                        className="
                            text-sm
                            text-gray-500
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

                <ToolbarSearch

                    value={search}
                    onChange={setSearch}
                    placeholder={searchPlaceholder}

                />

                {
                    filterOptions.length > 0 && (

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
                            h-11
                            px-4
                            rounded-2xl
                            border
                            bg-white

                            flex
                            items-center
                            gap-2

                            hover:bg-gray-50
                            transition
                        "
                    >
                        <Upload size={16} />
                        <span>Import</span>
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