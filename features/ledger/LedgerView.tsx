// @ts-nocheck
'use client'

import LedgerToolbar
    from './components/tables/LedgerToolbar'

import LedgerTable
    from './components/tables/LedgerTable'

import LedgerDrawer
    from './components/drawer/LedgerDrawer'

import LedgerAnalytics
    from './components/analytics/LedgerAnalytics'

import LedgerReport
    from './components/LedgerReport'

export default function LedgerView({

                                       /*
                                        |-------------------------------------------------------------
                                        | FILTERS
                                        |-------------------------------------------------------------
                                        */

                                       search,
                                       setSearch,

                                       /*
                                        |-------------------------------------------------------------
                                        | DATA
                                        |-------------------------------------------------------------
                                        */

                                       rows,
                                       loading,

                                       /*
                                        |-------------------------------------------------------------
                                        | ACTIONS
                                        |-------------------------------------------------------------
                                        */

                                       selectedRow,

                                       drawerOpen,

                                       openDrawer,
                                       closeDrawer,

                                       exportCSV,
                                       exportExcel

                                   }) {

    return (

        <div
            className="
                space-y-5
            "
        >

            <LedgerAnalytics
                rows={rows}
            />

            <LedgerReport />

            <LedgerToolbar

                search={search}
                setSearch={setSearch}

                onExportCSV={() =>
                    exportCSV(rows)
                }

                onExportExcel={() =>
                    exportExcel(rows)
                }

            />

            <LedgerTable

                rows={rows}

                loading={loading}

                onSelect={
                    openDrawer
                }

            />

            <LedgerDrawer

                open={
                    drawerOpen
                }

                row={
                    selectedRow
                }

                onClose={
                    closeDrawer
                }

            />

        </div>
    )
}