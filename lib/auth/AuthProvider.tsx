'use client'

import {

    createContext,
    useEffect,
    useState,
    type ReactNode

} from 'react'

import {

    getCurrentMembership

} from './getCurrentMembership'

import type { Membership } from '../../types'

import {

    supabase

} from '../supabase'

import {

    logActivity

} from '../services/activity-logger'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AuthContext = createContext<any>(null)

export function AuthProvider({ children }: { children: ReactNode }) {

    /*
     |-------------------------------------------------------------
     | STATE
     |-------------------------------------------------------------
     */

    const [

        membership,
        setMembership

    ] = useState<Membership | null>(null)

    const [

        loading,
        setLoading

    ] = useState(true)

    /*
     |-------------------------------------------------------------
     | LOAD MEMBERSHIP
     |-------------------------------------------------------------
     */

    async function load() {

        try {

            const result =

                await getCurrentMembership()

            setMembership(result)

        } catch (err) {

            if ((err as Error)?.message !== 'Unauthorized') {
                console.error('[AUTH PROVIDER]', err)
            }

        } finally {

            setLoading(false)
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load()

        // Keep Realtime auth token in sync with the current session.
        // Without this, an expired or stale token causes postgres_changes
        // events to be silently dropped (auth.uid() returns null server-side).
        const { data: { subscription } } =
            supabase.auth.onAuthStateChange((event, session) => {
                supabase.realtime.setAuth(session?.access_token ?? null)

                if (event === 'SIGNED_IN') {
                    // Show spinner immediately so AppShell doesn't redirect back
                    // to /login while getCurrentMembership() is still in flight.
                    setLoading(true)
                    getCurrentMembership()
                        .then(m => {
                            setMembership(m)
                            if (m?.status === 'active' && m?.rt?.id) {
                                logActivity({
                                    rtId:        m.rt.id,
                                    actorId:     m.user?.id,
                                    actorName:   m.user?.name,
                                    action:      'LOGIN',
                                    entityType:  'auth',
                                    entityId:    m.user?.id,
                                    description: `${m.user?.name} logged in`,
                                    metadata:    { role: m.role }
                                })
                            }
                        })
                        .catch(() => {})
                        .finally(() => setLoading(false))
                }

                if (event === 'SIGNED_OUT') {
                    setMembership(null)
                }
            })

        return () => subscription.unsubscribe()

    }, [])

    /*
     |-------------------------------------------------------------
     | CONTEXT VALUE
     |-------------------------------------------------------------
     */

    const value = {

        membership,

        loading,

        role:
        membership?.role,

        rtId:
        membership?.rt?.id,

        wargaId:
        membership?.resident?.id,

        user:
        membership?.user
    }

    return (

        <AuthContext.Provider

            value={value}
        >

            {children}

        </AuthContext.Provider>
    )
}