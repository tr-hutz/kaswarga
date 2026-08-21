'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase }                          from '@/lib/supabase'
import { useAuth }                           from '@/lib/auth/useAuth'
import Icon                                  from '@/components/ui/Icon'
import ImportApprovalModal                   from './ImportApprovalModal'
import { IMPORT_STATUS, type ImportJob, type ImportType } from '@/lib/import/types'

interface Props {
    importType:  ImportType
    onApproved?: () => void
}

export default function ImportApprovalBanner({ importType, onApproved }: Props) {
    const { rtId }                           = useAuth()
    const [jobs, setJobs]                    = useState<ImportJob[]>([])
    const [selectedJobId, setSelectedJobId]  = useState<string | null>(null)

    const loadPendingJobs = useCallback(async () => {
        if (!rtId) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
            .from('import_jobs')
            .select('*')
            .eq('rt_id', rtId)
            .eq('import_type', importType)
            .eq('status', IMPORT_STATUS.PENDING_APPROVAL)
            .order('created_at', { ascending: false })
            .limit(10)
        setJobs((data ?? []) as ImportJob[])
    }, [rtId, importType])

    useEffect(() => {
        loadPendingJobs()
    }, [loadPendingJobs])

    // Realtime — keep list fresh without polling
    useEffect(() => {
        if (!rtId) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const channel = (supabase as any)
            .channel(`import-approval-banner:${importType}:${rtId}`)
            .on('postgres_changes', {
                event:  '*',
                schema: 'public',
                table:  'import_jobs',
                filter: `rt_id=eq.${rtId}`,
            }, () => { loadPendingJobs() })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [rtId, importType, loadPendingJobs])

    if (jobs.length === 0) return null

    return (
        <>
            <div className="rounded-xl border border-warning/40 bg-warning/5 px-4 py-3 flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <Icon name="clock" size={18} className="text-warning shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            {jobs.length === 1
                                ? 'Ada 1 import menunggu persetujuan'
                                : `Ada ${jobs.length} import menunggu persetujuan`}
                        </p>
                        <p className="text-xs text-muted">
                            {jobs.map(j => `${j.success_rows} baris (${j.filename})`).join(', ')}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setSelectedJobId(jobs[0].id)}
                    className="shrink-0 text-sm font-medium text-primary hover:underline"
                >
                    Tinjau
                </button>
            </div>

            {selectedJobId && (
                <ImportApprovalModal
                    jobId={selectedJobId}
                    onClose={() => setSelectedJobId(null)}
                    onDone={() => { setSelectedJobId(null); loadPendingJobs(); onApproved?.() }}
                />
            )}
        </>
    )
}
