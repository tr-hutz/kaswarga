'use client'

import {

    useEffect

} from 'react'

import {

    supabase

} from '../../lib/supabase'

export function usePaymentConfirmationRealtime({

    onReload

}: {
    onReload?: () => void
}) {

    useEffect(() => {

        const channel =

            supabase

                .channel(
                    'payment-confirmation-realtime'
                )

                .on(

                    'postgres_changes',

                    {

                        event: '*',

                        schema: 'public',

                        table:
                            'payment_confirmations'

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
