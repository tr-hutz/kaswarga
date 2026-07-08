// @ts-nocheck
'use client'

import {

    useEffect

} from 'react'

import {

    supabase

} from '../../lib/supabase'

export function usePaymentConfirmationRealtime({

                                          onReload

                                      }) {

    useEffect(() => {

        const channel =

            supabase

                .channel(
                    'konfirmasi-pembayaran-realtime'
                )

                .on(

                    'postgres_changes',

                    {

                        event: '*',

                        schema: 'public',

                        table:
                            'konfirmasi_pembayaran'

                    },

                    payload => {

                        console.log(

                            '[REALTIME KONFIRMASI PEMBAYARAN]',
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