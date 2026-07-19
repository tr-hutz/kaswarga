import type { Theme } from '@/types/theme'

export const THEME_KEY       = 'kaswarga-theme' as const
export const AVAILABLE_THEMES: readonly Theme[] = ['light', 'dark', 'system']

/** Returns the localStorage key for a specific user, or the global fallback. */
export function getUserThemeKey(userId: string | null | undefined): string {
    return userId ? `${THEME_KEY}-${userId}` : THEME_KEY
}
