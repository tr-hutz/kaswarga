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

/** Poll active jobs this often as a fallback when Realtime misses an update. */
const POLL_INTERVAL_MS = 10_000

// Statuses that keep a job card alive in the floating panel.
// STAGED and PENDING_APPROVAL are excluded: ImportConfirmationBanner /
// ImportApprovalBanner on each module page are the canonical surfaces.
// The importer's card auto-dismisses once the job leaves the in-progress states.
const ACTIVE_STATUSES: ImportStatus[] = [
    IMPORT_STATUS.QUEUED,
    IMPORT_STATUS.PROCESSING,
    IMPORT_STATUS.VALIDATING,
    IMPORT_STATUS.PROMOTING,
]

// Only truly in-flight jobs are restored on mount.
const MOUNT_STATUSES: ImportStatus[] = [
    IMPORT_STATUS.QUEUED,
    IMPORT_STATUS.PROCESSING,
    IMPORT_STATUS.VALIDATING,
    IMPORT_STATUS.PROMOTING,
]

// Statuses that trigger auto-dismiss of the floating card after AUTO_DISMISS_MS.
// STAGED: Treasurer sees a brief "awaiting confirmation" message, then uses the
//   ImportConfirmationBanner on the page.
// PENDING_APPROVAL: importer sees brief "awaiting PIC" feedback, then the card
//   disappears — the ImportApprovalBanner is the canonical surface for the PIC.
const AUTO_DISMISS_STATUSES: ImportStatus[] = [
    IMPORT_STATUS.STAGED,
    IMPORT_STATUS.PROMOTED,
    IMPORT_STATUS.CANCELLED,
    IMPORT_STATUS.COMPLETED,
    IMPORT_STATUS.FAILED,
    IMPORT_STATUS.REJECTED,
    IMPORT_STATUS.PENDING_APPROVAL,
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

    // Auto-dismiss completed / failed / pending-approval cards after AUTO_DISMISS_MS
    useEffect(() => {
        const hasDismissible = jobs.some(j => (AUTO_DISMISS_STATUSES as ImportStatus[]).includes(j.status))
        if (!hasDismissible) return
        const timer = setTimeout(() => {
            setJobs(prev => prev.filter(j => !(AUTO_DISMISS_STATUSES as ImportStatus[]).includes(j.status)))
        }, AUTO_DISMISS_MS)
        return () => clearTimeout(timer)
    }, [jobs])

    // Polling fallback: if Realtime drops an update the card would stay stuck in
    // PROCESSING/VALIDATING forever. Re-fetch the latest state for active jobs.
    useEffect(() => {
        const activeIds = jobs
            .filter(j => (ACTIVE_STATUSES as ImportStatus[]).includes(j.status))
            .map(j => j.id)
        if (activeIds.length === 0) return

        const timer = setInterval(async () => {
            for (const id of activeIds) {
                try {
                    const res = await fetch(`/api/import/${id}`)
                    if (!res.ok) continue
                    const { job }: { job: ImportJob } = await res.json()
                    if (!job) continue
                    setJobs(prev => prev.map(j => j.id === id ? job : j))
                } catch {
                    // Non-critical — next tick will retry
                }
            }
        }, POLL_INTERVAL_MS)

        return () => clearInterval(timer)
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
