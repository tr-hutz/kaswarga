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
            supabase.auth.onAuthStateChange((_event, session) => {
                supabase.realtime.setAuth(session?.access_token ?? null)
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