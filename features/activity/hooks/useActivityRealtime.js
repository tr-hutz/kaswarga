'use client'

import {

    useEffect

} from 'react'

import {

    supabase

} from '../../../lib/supabase'

export function useActivityRealtime({

                                        onReload

                                    }) {

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

                    payload => {

                        console.log(

                            '[ACTIVITY REALTIME]',
                            payload

                        )

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