'use client'

import { useEffect, useState } from 'react'
import type { MemberRow } from '@/lib/repositories/member-override.repository'

export type RoleDetailTab = 'members' | 'matrix' | 'audit'

export interface RoleDetailData {
    id:           string
    code:         string
    name:         string
    description:  string | null
    is_system:    boolean
    is_active:    boolean
    member_count: number
}

const ROLE_CODE_TO_ENUM: Record<string, string> = {
    RT_CHAIR:  'CHAIR',
    RT_ADMIN:  'ADMIN',
    TREASURER: 'TREASURER',
    SECRETARY: 'SECRETARY',
    RESIDENT:  'RESIDENT',
}

export function useRoleDetail(roleId: string, roleCode: string) {
    const [members,        setMembers]        = useState<MemberRow[]>([])
    const [overrideCount,  setOverrideCount]  = useState<number>(0)
    const [loading,        setLoading]        = useState(true)
    const [error,          setError]          = useState<string | null>(null)
    const [activeTab,      setActiveTab]      = useState<RoleDetailTab>('members')
    const [overrideTarget, setOverrideTarget] = useState<string | null>(null)

    const roleEnum = ROLE_CODE_TO_ENUM[roleCode]

    useEffect(() => {
        async function load() {
            setLoading(true)
            setError(null)
            try {
                const [membersRes, countRes] = await Promise.all([
                    fetch('/api/members'),
                    fetch(`/api/roles/${roleId}/override-count`),
                ])

                if (!membersRes.ok) throw new Error('Failed to load members')
                if (!countRes.ok)   throw new Error('Failed to load override count')

                const allMembers = await membersRes.json() as MemberRow[]
                const { count }  = await countRes.json() as { count: number }

                const filtered = roleEnum
                    ? allMembers.filter(m => m.roleEnum === roleEnum)
                    : []

                setMembers(filtered)
                setOverrideCount(count)
            } catch (err) {
                setError((err as Error).message)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [roleId, roleEnum])

    return {
        members,
        overrideCount,
        loading,
        error,
        activeTab,
        setActiveTab,
        overrideTarget,
        setOverrideTarget,
    }
}
