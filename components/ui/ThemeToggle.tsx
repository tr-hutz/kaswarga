'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/lib/hooks/useTheme'
import type { Theme } from '@/types/theme'

const ICON: Record<Theme, typeof Sun> = {
    light:  Sun,
    dark:   Moon,
    system: Monitor,
}

const LABEL: Record<Theme, string> = {
    light:  'Light theme',
    dark:   'Dark theme',
    system: 'System theme',
}

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()
    const ThemeIcon = ICON[theme]

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-canvas transition-colors text-muted hover:text-foreground"
            aria-label={LABEL[theme]}
            title={LABEL[theme]}
        >
            <ThemeIcon size={18} />
        </button>
    )
}
