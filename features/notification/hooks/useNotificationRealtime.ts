'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
    useEffect,
    useLayoutEffect,
    useRef
} from 'react'

import {
    supabase
} from '@/lib/supabase'

export function useNotificationRealtime({
                                            user_id,
                                            onReload,
                                            onNew
                                        }: {
    user_id:   string | null | undefined
    onReload?: () => void
    onNew?:    (notification: any) => void
}) {

    const onReloadRef = useRef(onReload)
    const onNewRef    = useRef(onNew)
    useLayoutEffect(() => {
        onReloadRef.current = onReload
        onNewRef.current    = onNew
    })

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

                .subscribe((status: string, err?: Error) => {
                    if (err) console.error('[Realtime] subscription error', err)
                })

        return () => {

            supabase.removeChannel(
                channel
            )
        }

    }, [user_id])
}
