'use client'

import { useAuth }              from '@/lib/auth/useAuth'
import HomeView                 from './components/HomeView'
import SuperAdminHomeView       from './components/SuperAdminHomeView'
import { useHome }              from './hooks/useHome'
import { useSuperAdminHome }    from './hooks/useSuperAdminHome'

export default function HomeContainer() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { membership } = useAuth()
    const isSuperAdmin   = membership?.role === 'SUPER_ADMIN'

    // Both hooks are always called (React rules of hooks).
    // useHome bails gracefully when there is no resident/RT.
    const home           = useHome()
    const superAdminHome = useSuperAdminHome()

    if (isSuperAdmin) {
        return <SuperAdminHomeView {...superAdminHome} />
    }

    if (!membership?.rt?.id) return null

    return <HomeView {...home} />
}
