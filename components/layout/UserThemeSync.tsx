'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '../../lib/auth/useAuth'
import { useTheme } from '../../hooks/useTheme'

/**
 * Syncs the active theme storage key to the logged-in user.
 * Renders nothing — must be placed inside both AuthProvider and ThemeProvider.
 */
export default function UserThemeSync() {
    const { membership } = useAuth()
    const { syncForUser } = useTheme()
    const userId    = membership?.user?.id ?? null
    const prevUser  = useRef<string | null>(null)

    useEffect(() => {
        if (userId === prevUser.current) return
        prevUser.current = userId
        syncForUser(userId)
    }, [userId, syncForUser])

    return null
}
