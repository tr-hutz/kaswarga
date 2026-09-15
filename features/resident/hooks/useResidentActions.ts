'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState }      from 'react'
import { useAuth }       from '@/lib/auth/useAuth'
import { useToast }      from '@/components/ui/ToastProvider'
import { logActivity }   from '@/lib/services/activity-logger'
import { exportResidentsToExcel } from '@/features/resident/services/resident-export-transform'
import { exportFileName }         from '@/lib/export/export-utils'
import { useResidentImport } from './useResidentImport'

export function useResidentActions(onJobCreated?: (jobId: string) => void) {

    const { membership } = useAuth()
    const { toast }      = useToast()

    /*
     |------------------------------------------------------------------
     | STATE
     |------------------------------------------------------------------
     */

    const [selectedResident, setSelectedResident] = useState<any>(null)
    const [drawerOpen,       setDrawerOpen]       = useState(false)
    const [formOpen,         setFormOpen]         = useState(false)

    /*
     |------------------------------------------------------------------
     | DRAWER
     |------------------------------------------------------------------
     */

    function openDrawer(resident: any) {
        setSelectedResident(resident)
        setDrawerOpen(true)
    }

    function closeDrawer() {
        setDrawerOpen(false)
        setSelectedResident(null)
    }

    /*
     |------------------------------------------------------------------
     | FORM
     |------------------------------------------------------------------
     */

    function openCreateForm() {
        setSelectedResident(null)
        setFormOpen(true)
    }

    function openEditForm(resident: any) {
        setSelectedResident(resident)
        setFormOpen(true)
    }

    function closeForm() {
        setFormOpen(false)
    }

    /*
     |------------------------------------------------------------------
     | EXPORT
     |------------------------------------------------------------------
     */

    async function exportExcel(data: any[]) {
        const rtCode   = membership?.rt?.code ?? undefined
        const fileName = exportFileName(membership?.rt?.name ?? 'RT', 'warga')
        await exportResidentsToExcel(data as any, rtCode, fileName)
        logActivity({
            rtId:        membership?.rt?.id,
            actorId:     membership?.user?.id,
            actorName:   membership?.user?.name,
            action:      'EXPORT',
            entityType:  'residents',
            description: `${membership?.user?.name ?? 'Pengguna'} mengekspor data penghuni`,
        })
        if (process.env.NODE_ENV === 'production' && rtCode) {
            toast({ message: 'File dilindungi password. Gunakan kode RT untuk membuka.', type: 'success' })
        }
    }

    /*
     |------------------------------------------------------------------
     | IMPORT
     |------------------------------------------------------------------
     */

    const importState = useResidentImport(onJobCreated)

    /*
     |------------------------------------------------------------------
     | RETURN
     |------------------------------------------------------------------
     */

    return {
        selectedResident,
        drawerOpen,
        openDrawer,
        closeDrawer,
        formOpen,
        openCreateForm,
        openEditForm,
        closeForm,
        exportExcel,
        ...importState,
    }
}
