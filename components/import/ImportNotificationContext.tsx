'use client'

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react'
import { supabase }                   from '@/lib/supabase'
import { IMPORT_STATUS, type ImportJob, type ImportStatus } from '@/lib/import/types'

// Statuses that are shown live via Realtime during the current session.
const ACTIVE_STATUSES: ImportStatus[] = [
    IMPORT_STATUS.QUEUED,
    IMPORT_STATUS.PROCESSING,
    IMPORT_STATUS.VALIDATING,
    IMPORT_STATUS.PENDING_APPROVAL,
]

// Only truly in-flight jobs are restored on mount.
// PENDING_APPROVAL is intentionally excluded: those jobs persist in the DB
// indefinitely and would re-appear on every page load, which is annoying.
// The ImportApprovalBanner on each module page provides the canonical
// visibility for pending approval batches.
const MOUNT_STATUSES: ImportStatus[] = [
    IMPORT_STATUS.QUEUED,
    IMPORT_STATUS.PROCESSING,
    IMPORT_STATUS.VALIDATING,
]

const TERMINAL_STATUSES: ImportStatus[] = [
    IMPORT_STATUS.COMPLETED,
    IMPORT_STATUS.FAILED,
    IMPORT_STATUS.REJECTED,
]

const AUTO_DISMISS_MS = 6000

interface ImportNotificationContextValue {
    jobs:       ImportJob[]
    trackJob:   (jobId: string) => void
    dismissJob: (jobId: string) => void
}

export const ImportNotificationContext = createContext<ImportNotificationContextValue>({
    jobs:       [],
    trackJob:   () => {},
    dismissJob: () => {},
})

export function useImportNotifications() {
    return useContext(ImportNotificationContext)
}

export function ImportNotificationProvider({
    rtId,
    userId,
    children,
}: {
    rtId:    string | null | undefined
    userId?: string | null
    children: ReactNode
}) {
    const [jobs, setJobs] = useState<ImportJob[]>([])
    const dismissedRef    = useRef(new Set<string>())

    // Load in-progress jobs on mount — only jobs the current user created
    useEffect(() => {
        if (!rtId || !userId) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(supabase as any)
            .from('import_jobs')
            .select('*')
            .in('status', MOUNT_STATUSES)
            .eq('created_by', userId)
            .order('created_at', { ascending: false })
            .limit(20)
            .then(({ data }: { data: ImportJob[] | null }) => {
                if (data) {
                    setJobs(data.filter(j => !dismissedRef.current.has(j.id)))
                }
            })
    }, [rtId, userId])

    // Realtime subscription for live updates — only own jobs
    useEffect(() => {
        if (!rtId || !userId) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const channel = (supabase as any)
            .channel(`import-jobs:${rtId}:${userId}`)
            .on('postgres_changes', {
                event:  '*',
                schema: 'public',
                table:  'import_jobs',
                filter: `rt_id=eq.${rtId}`,
            }, (payload: { new: ImportJob }) => {
                const updated = payload.new
                if (!updated?.id) return
                if (updated.created_by !== userId) return
                if (dismissedRef.current.has(updated.id)) return

                setJobs(prev => {
                    const idx = prev.findIndex(j => j.id === updated.id)
                    if (idx >= 0) {
                        const next = [...prev]
                        next[idx] = updated
                        return next
                    }
                    if ((ACTIVE_STATUSES as ImportStatus[]).includes(updated.status)) {
                        return [updated, ...prev]
                    }
                    return prev
                })
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [rtId, userId])

    // Auto-dismiss terminal jobs after AUTO_DISMISS_MS
    useEffect(() => {
        const hasTerminal = jobs.some(j => (TERMINAL_STATUSES as ImportStatus[]).includes(j.status))
        if (!hasTerminal) return
        const timer = setTimeout(() => {
            setJobs(prev => prev.filter(j => !(TERMINAL_STATUSES as ImportStatus[]).includes(j.status)))
        }, AUTO_DISMISS_MS)
        return () => clearTimeout(timer)
    }, [jobs])

    function trackJob(jobId: string) {
        fetch(`/api/import/${jobId}`)
            .then(r => r.json())
            .then(({ job }: { job: ImportJob }) => {
                if (!job) return
                if (dismissedRef.current.has(job.id)) return
                setJobs(prev => {
                    const idx = prev.findIndex(j => j.id === job.id)
                    if (idx >= 0) {
                        const next = [...prev]
                        next[idx] = job
                        return next
                    }
                    return [job, ...prev]
                })
            })
            .catch(() => {})
    }

    function dismissJob(jobId: string) {
        dismissedRef.current.add(jobId)
        setJobs(prev => prev.filter(j => j.id !== jobId))
    }

    return (
        <ImportNotificationContext.Provider value={{ jobs, trackJob, dismissJob }}>
            {children}
        </ImportNotificationContext.Provider>
    )
}
