'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations }                       from 'next-intl'
import type { PermissionViewRow }                from '@/features/authorization/viewer/hooks/useEffectivePermission'
import type { InspectorTab, PermissionDetails }  from '../types'

interface ApiPermissionRow {
    id:          string
    code:        string
    name:        string
    description: string | null
    is_system:   boolean
}

export interface InspectorMemberRow {
    membershipId: string
    userId:       string
    name:         string | null
    email:        string | null
    roleEnum:     string
    status:       string
}

export interface MemberDetailData {
    membershipId: string
    name:         string | null
    roleCode:     string
    roleName:     string
    status:       string
    permissions:  PermissionViewRow[]
    summary: {
        granted:   number
        denied:    number
        overrides: number
        total:     number
    }
}

export function usePermissionInspector() {
    const t = useTranslations('inspector')

    const [activeTab,       setActiveTab]       = useState<InspectorTab>('permission')

    // Permission View
    const [permissions,     setPermissions]     = useState<ApiPermissionRow[]>([])
    const [permSearch,      setPermSearch]      = useState('')
    const [moduleFilter,    setModuleFilter]    = useState('all')
    const [selectedPermId,  setSelectedPermId]  = useState<string | null>(null)
    const [permDetail,      setPermDetail]      = useState<PermissionDetails | null>(null)
    const [loadingDetail,   setLoadingDetail]   = useState(false)

    // Member View
    const [members,          setMembers]         = useState<InspectorMemberRow[]>([])
    const [memberSearch,     setMemberSearch]    = useState('')
    const [roleFilter,       setRoleFilter]      = useState('all')
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
    const [memberDetail,     setMemberDetail]    = useState<MemberDetailData | null>(null)
    const [loadingMember,    setLoadingMember]   = useState(false)

    // Shared
    const [loading, setLoading] = useState(true)
    const [error,   setError]   = useState<string | null>(null)

    useEffect(() => {
        async function init() {
            setLoading(true)
            setError(null)
            try {
                const [permRes, memRes] = await Promise.all([
                    fetch('/api/permissions'),
                    fetch('/api/members'),
                ])
                const errors: string[] = []
                if (permRes.ok) {
                    setPermissions(await permRes.json())
                } else {
                    errors.push('Failed to load permissions')
                }
                if (memRes.ok) {
                    setMembers(await memRes.json())
                } else {
                    errors.push('Failed to load members')
                }
                if (errors.length > 0) setError(errors.join('; '))
            } catch (err) {
                setError((err as Error).message)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [])

    const prevPermId = useRef<string | null>(null)
    useEffect(() => {
        if (!selectedPermId || selectedPermId === prevPermId.current) return
        prevPermId.current = selectedPermId

        async function loadDetail() {
            setLoadingDetail(true)
            setPermDetail(null)
            setError(null)
            try {
                const res = await fetch(`/api/permissions/${selectedPermId}/details`)
                if (!res.ok) throw new Error('Failed to load permission details')
                setPermDetail(await res.json() as PermissionDetails)
            } catch (err) {
                setError((err as Error).message)
            } finally {
                setLoadingDetail(false)
            }
        }
        loadDetail()
    }, [selectedPermId])

    const prevMemberId = useRef<string | null>(null)
    useEffect(() => {
        if (!selectedMemberId || selectedMemberId === prevMemberId.current) return
        prevMemberId.current = selectedMemberId

        async function loadMember() {
            setLoadingMember(true)
            setMemberDetail(null)
            setError(null)
            try {
                const res = await fetch(`/api/members/${selectedMemberId}/overrides`)
                if (!res.ok) throw new Error('Failed to load member permissions')
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = await res.json() as any

                const rows: PermissionViewRow[] = (data.permissions ?? []).map((p: {
                    id: string; code: string; name: string; description: string | null;
                    roleAllow: boolean | null; overrideAllow: boolean | null
                }) => {
                    let source: PermissionViewRow['source']
                    let effective: boolean
                    if (p.overrideAllow === true)        { source = 'override_grant';  effective = true  }
                    else if (p.overrideAllow === false)  { source = 'override_revoke'; effective = false }
                    else if (p.roleAllow === true)       { source = 'role';            effective = true  }
                    else                                 { source = 'none';            effective = false }

                    return {
                        id:            p.id,
                        code:          p.code,
                        name:          p.name,
                        description:   p.description,
                        module:        p.code.split('.')[0] ?? 'other',
                        roleAllow:     p.roleAllow,
                        overrideAllow: p.overrideAllow,
                        effective,
                        source,
                        reason: t(`reason.${source}` as Parameters<typeof t>[0]),
                    }
                })

                setMemberDetail({
                    membershipId: (data.member?.membershipId ?? '') as string,
                    name:         (data.member?.name ?? null) as string | null,
                    roleCode:     (data.member?.roleCode ?? '') as string,
                    roleName:     (data.member?.roleName ?? '') as string,
                    status:       (data.member?.status ?? '') as string,
                    permissions:  rows,
                    summary: {
                        granted:   rows.filter(r => r.effective).length,
                        denied:    rows.filter(r => !r.effective).length,
                        overrides: rows.filter(r => r.overrideAllow !== null).length,
                        total:     rows.length,
                    },
                })
            } catch (err) {
                setError((err as Error).message)
            } finally {
                setLoadingMember(false)
            }
        }
        loadMember()
    }, [selectedMemberId, t])

    const selectedPermission = useMemo(
        () => permissions.find(p => p.id === selectedPermId) ?? null,
        [permissions, selectedPermId]
    )

    const modules = useMemo(() => {
        const set = new Set(permissions.map(p => p.code.split('.')[0] ?? 'other'))
        return Array.from(set).sort()
    }, [permissions])

    const filteredPermissions = useMemo(() => {
        return permissions.filter(p => {
            if (moduleFilter !== 'all' && (p.code.split('.')[0] ?? 'other') !== moduleFilter) return false
            if (!permSearch.trim()) return true
            const q = permSearch.toLowerCase()
            return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
        })
    }, [permissions, permSearch, moduleFilter])

    const roleGroups = useMemo(() => {
        const map = new Map<string, number>()
        for (const m of members) map.set(m.roleEnum, (map.get(m.roleEnum) ?? 0) + 1)
        return Array.from(map.entries()).map(([roleEnum, count]) => ({ roleEnum, count }))
    }, [members])

    const filteredMembers = useMemo(() => {
        return members.filter(m => {
            if (roleFilter !== 'all' && m.roleEnum !== roleFilter) return false
            if (!memberSearch.trim()) return true
            const q = memberSearch.toLowerCase()
            return (m.name ?? '').toLowerCase().includes(q) || (m.email ?? '').toLowerCase().includes(q)
        })
    }, [members, memberSearch, roleFilter])

    function selectPermission(id: string) {
        prevPermId.current = null
        setSelectedPermId(id)
        setPermDetail(null)
    }

    function selectMember(membershipId: string) {
        prevMemberId.current = null
        setSelectedMemberId(membershipId)
        setMemberDetail(null)
    }

    return {
        activeTab, setActiveTab,
        filteredPermissions, permSearch, setPermSearch, moduleFilter, setModuleFilter, modules,
        selectedPermId, selectedPermission, permDetail, loadingDetail, selectPermission,
        filteredMembers, memberSearch, setMemberSearch, roleFilter, setRoleFilter, roleGroups,
        selectedMemberId, memberDetail, loadingMember, selectMember,
        loading, error,
    }
}
