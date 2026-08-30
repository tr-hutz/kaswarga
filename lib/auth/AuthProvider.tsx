'use client'

import {

    createContext,
    useEffect,
    useRef,
    useState,
    type ReactNode

} from 'react'

import {

    getCurrentMembership

} from './getCurrentMembership'

import {

    getEffectivePermissions

} from './actions/getEffectivePermissions'

import type { Membership } from '../../types'
import type { Permission } from './types'

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

        permissions,
        setPermissions

    ] = useState<ReadonlySet<Permission>>(new Set())

    const [

        loading,
        setLoading

    ] = useState(true)

    // Tracks the authenticated user id so we can skip reloads caused by
    // Supabase's silent token refresh (which also fires SIGNED_IN).
    const activeUserIdRef = useRef<string | null>(null)

    /*
     |-------------------------------------------------------------
     | LOAD MEMBERSHIP
     |-------------------------------------------------------------
     */

    async function load() {

        try {

            const result = await getCurrentMembership()

            activeUserIdRef.current = result?.user?.id ?? null
            setMembership(result)

            if (result?.status === 'active') {
                const perms = await getEffectivePermissions()
                setPermissions(new Set(perms))
            } else {
                setPermissions(new Set())
            }

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
                    const incomingUserId = session?.user?.id ?? null

                    // Skip reload when it's just a silent token refresh for the
                    // same user — Supabase fires SIGNED_IN on every token refresh,
                    // which would otherwise cause a visible loading flash on tab focus.
                    if (incomingUserId && incomingUserId === activeUserIdRef.current) {
                        return
                    }

                    // New login: show spinner so AppShell doesn't redirect to /login
                    // while getCurrentMembership() is still in flight.
                    setLoading(true)
                    getCurrentMembership()
                        .then(async m => {
                            activeUserIdRef.current = m?.user?.id ?? null
                            setMembership(m)
                            if (m?.status === 'active') {
                                const perms = await getEffectivePermissions()
                                setPermissions(new Set(perms))
                                logActivity({
                                    rtId:        m.rt?.id ?? null,
                                    actorId:     m.user?.id,
                                    actorName:   m.user?.name,
                                    action:      'LOGIN',
                                    entityType:  'auth',
                                    entityId:    m.user?.id,
                                    description: `${m.user?.name} logged in`,
                                    metadata:    { role: m.role }
                                })
                            } else {
                                setPermissions(new Set())
                            }
                        })
                        .catch(() => {})
                        .finally(() => setLoading(false))
                }

                if (event === 'SIGNED_OUT') {
                    activeUserIdRef.current = null
                    setMembership(null)
                    setPermissions(new Set())
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

        permissions,

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