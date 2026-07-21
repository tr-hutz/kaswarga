'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
    useEffect
} from 'react'

import {
    supabase
} from '../../../lib/supabase'

export function useLedgerRealtime({

                                      onReload

                                  }: { onReload?: () => void }) {

    useEffect(() => {

        const channel =
            supabase

                .channel(
                    'ledger-realtime'
                )

                .on(

                    'postgres_changes',

                    {

                        event: '*',

                        schema: 'public',

                        table: 'ledger'

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

    }, [])
}