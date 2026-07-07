// @ts-nocheck
'use client'

import {
    useEffect
} from 'react'

import {
    supabase
} from '../../../lib/supabase'

export function useExpenseRealtime({

                                           onReload

                                       }) {

    useEffect(() => {

        const channel =
            supabase

                .channel(
                    'pengeluaran-realtime'
                )

                .on(

                    'postgres_changes',

                    {

                        event: '*',

                        schema: 'public',

                        table: 'pengeluaran'

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