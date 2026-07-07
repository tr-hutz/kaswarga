'use client'

import {

    hasPermission

} from './permissions'

import {

    useAuth

} from '../auth/useAuth'

export function usePermission(permission: string): boolean {
    const auth = useAuth()
    return hasPermission((auth as { membership?: { role?: string } } | null)?.membership?.role, permission)
}