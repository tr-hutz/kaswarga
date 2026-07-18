import type { Theme } from '@/types/theme'

export const THEME_KEY       = 'kaswarga-theme' as const
export const AVAILABLE_THEMES: readonly Theme[] = ['light', 'dark', 'system']
