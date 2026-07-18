'use client'

import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AVAILABLE_THEMES, THEME_KEY } from '@/lib/theme'
import type { Theme, ResolvedTheme } from '@/types/theme'

interface ThemeContextValue {
    theme:           Theme
    resolvedTheme:   ResolvedTheme
    setTheme:        (theme: Theme) => void
    toggleTheme:     () => void
    availableThemes: readonly Theme[]
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState]           = useState<Theme>('system')
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')
    // Guards the localStorage read so it only happens once on mount.
    const initialized = useRef(false)

    useEffect(() => {
        // First run: sync React state from localStorage before applying to DOM.
        // We defer the DOM update to the next run (after state is correct) to
        // avoid showing the wrong theme for one frame.
        if (!initialized.current) {
            initialized.current = true
            const stored    = localStorage.getItem(THEME_KEY) as Theme | null
            const effective = (stored && (AVAILABLE_THEMES as readonly string[]).includes(stored))
                ? (stored as Theme)
                : 'system'
            if (effective !== theme) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setThemeState(effective)
                return // Effect re-runs with corrected theme value
            }
        }

        // Apply resolved theme to DOM
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
        document.documentElement.classList.toggle('dark', isDark)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setResolvedTheme(isDark ? 'dark' : 'light')

        if (theme !== 'system') return

        // Track OS preference changes while in system mode
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
        localStorage.setItem(THEME_KEY, t)
    }, [])

    const toggleTheme = useCallback(() => {
        const next = AVAILABLE_THEMES[(AVAILABLE_THEMES.indexOf(theme) + 1) % AVAILABLE_THEMES.length]
        setTheme(next)
    }, [theme, setTheme])

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme, availableThemes: AVAILABLE_THEMES }}>
            {children}
        </ThemeContext.Provider>
    )
}
