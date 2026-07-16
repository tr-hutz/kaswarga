// @ts-nocheck
'use client'

import {
    useEffect,
    useRef
} from 'react'

import {
    supabase
} from '../../../lib/supabase'

export function useNotificationRealtime({
                                            user_id,
                                            onReload,
                                            onNew
                                        }) {

    const onReloadRef = useRef(onReload)
    const onNewRef    = useRef(onNew)
    onReloadRef.current = onReload
    onNewRef.current    = onNew

    useEffect(() => {
        if (!user_id) {
            return
        }

        const channel =

            supabase

                .channel(
                    `notifications-user-${user_id}`
                )

                .on(

                    'postgres_changes',

                    {

                        event: 'INSERT',

                        schema: 'public',

                        table: 'notifications',

                        filter: `target_user_id=eq.${user_id}`

                    },

                    (payload) => {

                        onReloadRef.current?.()
                        onNewRef.current?.(payload.new)
                    }

                )

                .subscribe((status, err) => {
                    if (err) console.error('[Realtime] subscription error', err)
                })

        return () => {

            supabase.removeChannel(
                channel
            )
        }

    }, [user_id])
}
