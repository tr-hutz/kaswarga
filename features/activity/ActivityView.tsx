// @ts-nocheck
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import ActivityTable from './components/tables/ActivityTable'
import ActivityDrawer from './components/drawer/ActivityDrawer'
import ActivityAnalytics from './components/analytics/ActivityAnalytics'

export default function ActivityView({ rows, loading }) {

    const [selectedRow, setSelectedRow] = useState(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const t = useTranslations('activity')

    function openDrawer(row) {
        setSelectedRow(row)
        setDrawerOpen(true)
    }

    function closeDrawer() {
        setDrawerOpen(false)
        setSelectedRow(null)
    }

    if (loading) {
        return (
            <div>
                {t('loading')}
            </div>
        )
    }

    return (
        <div className="space-y-5">

            <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-slate-500">{t('subtitle')}</p>
            </div>

            <ActivityAnalytics rows={rows} />

            <ActivityTable rows={rows} onSelect={openDrawer} />

            <ActivityDrawer open={drawerOpen} row={selectedRow} onClose={closeDrawer} />

        </div>
    )
}
