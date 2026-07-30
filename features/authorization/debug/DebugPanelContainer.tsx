'use client'

import { useRouter }      from 'next/navigation'
import DebugPanelView     from './DebugPanelView'
import type { DebugData } from './types'

interface Props { debugData: DebugData }

export default function DebugPanelContainer({ debugData }: Props) {
    const router = useRouter()

    function handleRefresh() {
        router.refresh()
    }

    function handleExportJson() {
        const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `auth-debug-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <DebugPanelView
            debugData={debugData}
            onRefresh={handleRefresh}
            onExportJson={handleExportJson}
        />
    )
}
