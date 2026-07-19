'use client'

import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AVAILABLE_THEMES, THEME_KEY, getUserThemeKey } from '@/lib/theme'
import type { Theme, ResolvedTheme } from '@/types/theme'

interface ThemeContextValue {
    theme:           Theme
    resolvedTheme:   ResolvedTheme
    setTheme:        (theme: Theme) => void
    toggleTheme:     () => void
    availableThemes: readonly Theme[]
    /** Called by UserThemeSync when the logged-in user changes. */
    syncForUser:     (userId: string | null) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyToDOM(t: Theme, setResolved: (r: ResolvedTheme) => void) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = t === 'dark' || (t === 'system' && prefersDark)
    document.documentElement.classList.toggle('dark', isDark)
    setResolved(isDark ? 'dark' : 'light')
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState]           = useState<Theme>('system')
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')
    // Active storage key — starts with global fallback, updated per-user on login.
    const storageKey  = useRef<string>(THEME_KEY)
    const initialized = useRef(false)

    useEffect(() => {
        // First run: read from global key (pre-login fallback) and apply.
        if (!initialized.current) {
            initialized.current = true
            const stored    = localStorage.getItem(storageKey.current) as Theme | null
            const effective = (stored && (AVAILABLE_THEMES as readonly string[]).includes(stored))
                ? stored as Theme
                : 'system'
            if (effective !== theme) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setThemeState(effective)
                return // Effect re-runs with the corrected theme
            }
        }

        applyToDOM(theme, setResolvedTheme)

        if (theme !== 'system') return
        const mq      = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = () => {
            document.documentElement.classList.toggle('dark', mq.matches)
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setResolvedTheme(mq.matches ? 'dark' : 'light')
        }
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [theme])

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t)
        localStorage.setItem(storageKey.current, t)
    }, [])

    /**
     * Called by UserThemeSync when a user logs in or out.
     * Switches the active storage key and loads that user's saved preference.
     */
    const syncForUser = useCallback((userId: string | null) => {
        const key = getUserThemeKey(userId)
        storageKey.current = key

        const stored    = localStorage.getItem(key) as Theme | null
        const effective = (stored && (AVAILABLE_THEMES as readonly string[]).includes(stored))
            ? stored as Theme
            : 'system'
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setThemeState(effective)
    }, [])

    const toggleTheme = useCallback(() => {
        const next = AVAILABLE_THEMES[(AVAILABLE_THEMES.indexOf(theme) + 1) % AVAILABLE_THEMES.length]
        setTheme(next)
    }, [theme, setTheme])

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme, availableThemes: AVAILABLE_THEMES, syncForUser }}>
            {children}
        </ThemeContext.Provider>
    )
}
