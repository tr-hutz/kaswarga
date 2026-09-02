'use client'

import {
    useEffect
} from 'react'

import {
    supabase
} from '@/lib/supabase'

export function useExpenseRealtime({

                                           onReload

                                       }: { onReload?: () => void }) {

    useEffect(() => {

        const channel =
            supabase

                .channel(
                    'expense-realtime'
                )

                .on(

                    'postgres_changes',

                    {

                        event: '*',

                        schema: 'public',

                        table: 'expenses'

                    },

                    () => {

                        onReload?.()
                    }

                )

                .subscribe()

        return () => {

            supabase.removeChannel(
                channel
            )
        }

    }, [onReload])
}