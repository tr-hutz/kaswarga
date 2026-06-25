'use client'

import {

    createContext,
    useEffect,
    useState

} from 'react'

import {

    getCurrentMembership

} from './getCurrentMembership'

import {

    supabase

} from '../supabase'

import {

    logActivity

} from '../services/activity-logger'

export const AuthContext =

    createContext(null)

export function AuthProvider({

                                 children

                             }) {

    /*
     |-------------------------------------------------------------
     | STATE
     |-------------------------------------------------------------
     */

    const [

        membership,
        setMembership

    ] = useState(null)

    const [

        loading,
        setLoading

    ] = useState(true)

    /*
     |-------------------------------------------------------------
     | LOAD MEMBERSHIP
     |-------------------------------------------------------------
     */

    useEffect(() => {

        load()

        // Keep Realtime auth token in sync with the current session.
        // Without this, an expired or stale token causes postgres_changes
        // events to be silently dropped (auth.uid() returns null server-side).
        const { data: { subscription } } =
            supabase.auth.onAuthStateChange((event, session) => {
                supabase.realtime.setAuth(session?.access_token ?? null)

                if (event === 'SIGNED_IN') {
                    getCurrentMembership()
                        .then(m => {
                            logActivity({
                                rtId:       m?.rt?.id,
                                actorId:    m?.user?.id,
                                actorName:  m?.user?.nama,
                                action:     'LOGIN',
                                entityType: 'auth',
                                entityId:   m?.user?.id,
                                description: `${m?.user?.nama} logged in`,
                                metadata:   { role: m?.role }
                            })
                        })
                        .catch(() => {})
                }
            })

        return () => subscription.unsubscribe()

    }, [])

    async function load() {

        try {

            const result =

                await getCurrentMembership()

            setMembership(result)

        } catch (err) {

            console.error(

                '[AUTH PROVIDER]',

                err
            )

        } finally {

            setLoading(false)
        }
    }

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
        membership?.rt_id,

        wargaId:
        membership?.warga_id,

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