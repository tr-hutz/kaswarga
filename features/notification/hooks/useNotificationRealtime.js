'use client'

import {
    useEffect
} from 'react'

import {
    supabase
} from '../../../lib/supabase'

export function useNotificationRealtime({

                                            onReload

                                        }) {

    useEffect(() => {

        const channel =

            supabase

                .channel(
                    'notifications-realtime'
                )

                .on(

                    'postgres_changes',

                    {

                        event: 'INSERT',

                        schema: 'public',

                        table: 'notifications'

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