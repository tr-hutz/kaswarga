'use client'

import { useEffect }  from 'react'
import { useAuth }    from '@/lib/auth/useAuth'
import { supabase }   from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useIncomeRealtime({ onReload }: { onReload: () => void }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { membership } = useAuth()
    const rtId = membership?.rt?.id as string | undefined

    useEffect(() => {
        if (!rtId) return

        const channel = supabase
            .channel(`income:${rtId}`)
            .on(
                'postgres_changes',
                {
                    event:  '*',
                    schema: 'public',
                    table:  'income_transactions',
                    filter: `rt_id=eq.${rtId}`,
                },
                () => onReload(),
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [rtId, onReload])
}
