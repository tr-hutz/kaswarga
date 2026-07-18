'use client'

import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'
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

function readStoredTheme(): Theme {
    if (typeof window === 'undefined') return 'system'
    const stored = localStorage.getItem(THEME_KEY)
    return stored && (AVAILABLE_THEMES as readonly string[]).includes(stored)
        ? (stored as Theme)
        : 'system'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState]           = useState<Theme>(readStoredTheme)
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')

    useEffect(() => {
        function apply(t: Theme) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            const isDark = t === 'dark' || (t === 'system' && prefersDark)
            document.documentElement.classList.toggle('dark', isDark)
            setResolvedTheme(isDark ? 'dark' : 'light')
        }

        apply(theme)

        if (theme !== 'system') return

        const mq      = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = () => apply('system')
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
