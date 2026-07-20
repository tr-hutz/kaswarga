'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import {

    useEffect

} from 'react'

import {

    supabase

} from '../../../lib/supabase'

export function useActivityRealtime({

                                        onReload

                                    }: { onReload?: () => void }) {

    useEffect(() => {

        const channel =

            supabase

                .channel(
                    'activity-realtime'
                )

                .on(

                    'postgres_changes',

                    {

                        event: '*',

                        schema: 'public',

                        table:
                            'activity_logs'

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