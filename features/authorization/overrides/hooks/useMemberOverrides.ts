'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { MemberRow }  from '@/lib/repositories/member-override.repository'

export type OverrideFilter = 'all' | 'granted' | 'denied' | 'override'

export interface PermissionDetail {
    id:            string
    code:          string
    name:          string
    description:   string | null
    roleAllow:     boolean | null
    overrideAllow: boolean | null
}

export interface MemberInfo {
    membershipId: string
    userId:       string
    name:         string | null
    email:        string | null
    roleCode:     string
    roleName:     string
    status:       string
}

export interface PermissionGroup {
    module:      string
    permissions: PermissionDetail[]
}

export interface OverrideSummary {
    granted:   number
    denied:    number
    overrides: number
}

export interface RoleGroup {
    roleEnum: string
    count:    number
}

type OverrideMap = Map<string, boolean | null>

function groupPermissions(perms: PermissionDetail[]): PermissionGroup[] {
    const map = new Map<string, PermissionDetail[]>()
    for (const p of perms) {
        const module = p.code.split('.')[0] ?? 'other'
        const list   = map.get(module) ?? []
        list.push(p)
        map.set(module, list)
    }
    return Array.from(map.entries()).map(([module, permissions]) => ({ module, permissions }))
}

function overrideMapsEqual(a: OverrideMap, b: OverrideMap): boolean {
    if (a.size !== b.size) return false
    for (const [k, v] of a) {
        if (b.get(k) !== v) return false
    }
    return true
}

interface HookOptions {
    canEdit:             boolean
    singleMembershipId?: string
    initialRole?:        string
}

export function useMemberOverrides({ canEdit, singleMembershipId, initialRole }: HookOptions) {
    const t          = useTranslations('overrides')
    const singleMode = !!singleMembershipId

    const [allMembers,     setAllMembers]     = useState<MemberRow[]>([])
    const [memberSearch,   setMemberSearch]   = useState('')
    const [selectedRole,   setSelectedRole]   = useState<string | null>(initialRole ?? null)
    const [selectedId,     setSelectedId]     = useState<string | null>(singleMembershipId ?? null)
    const [memberInfo,     setMemberInfo]     = useState<MemberInfo | null>(null)
    const [roleId,         setRoleId]         = useState<string>('')
    const [groups,         setGroups]         = useState<PermissionGroup[]>([])
    const [filteredGroups, setFilteredGroups] = useState<PermissionGroup[]>([])
    const [search,         setSearch]         = useState('')
    const [filter,         setFilter]         = useState<OverrideFilter>('all')
    const [savedOverrides, setSavedOverrides] = useState<OverrideMap>(new Map())
    const [localOverrides, setLocalOverrides] = useState<OverrideMap>(new Map())
    const [loading,        setLoading]        = useState(!singleMode)
    const [loadingMember,  setLoadingMember]  = useState(singleMode)
    const [saving,         setSaving]         = useState(false)
    const [error,          setError]          = useState<string | null>(null)

    const isDirty = !overrideMapsEqual(localOverrides, savedOverrides)

    const dirtyCount = useMemo(() => {
        let count = 0
        for (const [permId, localAllow] of localOverrides) {
            const savedAllow = savedOverrides.get(permId) ?? null
            if (localAllow !== savedAllow) count++
        }
        return count
    }, [localOverrides, savedOverrides])

    const summary: OverrideSummary = useMemo(() => {
        let granted = 0, denied = 0, overrides = 0
        for (const group of groups) {
            for (const p of group.permissions) {
                const localOverride = localOverrides.get(p.id) ?? null
                const effective     = localOverride !== null ? localOverride : (p.roleAllow === true)
                if (effective) granted++; else denied++
                if (localOverride !== null) overrides++
            }
        }
        return { granted, denied, overrides }
    }, [groups, localOverrides])

    // Role groups derived from all members (for Stage 1 left panel)
    const roleGroups: RoleGroup[] = useMemo(() => {
        const map = new Map<string, number>()
        for (const m of allMembers) {
            map.set(m.roleEnum, (map.get(m.roleEnum) ?? 0) + 1)
        }
        return Array.from(map.entries()).map(([roleEnum, count]) => ({ roleEnum, count }))
    }, [allMembers])

    useEffect(() => {
        function onBeforeUnload(e: BeforeUnloadEvent) {
            if (isDirty) e.preventDefault()
        }
        window.addEventListener('beforeunload', onBeforeUnload)
        return () => window.removeEventListener('beforeunload', onBeforeUnload)
    }, [isDirty])

    // Load member list (full mode only)
    useEffect(() => {
        if (singleMode) return
        async function init() {
            setLoading(true)
            setError(null)
            try {
                const res = await fetch('/api/members')
                if (!res.ok) throw new Error('Failed to load members')
                setAllMembers(await res.json() as MemberRow[])
            } catch (err) {
                setError((err as Error).message)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [singleMode])

    // Load overrides when selected member changes
    const prevSelectedId = useRef<string | null>(null)
    useEffect(() => {
        if (!selectedId || selectedId === prevSelectedId.current) return
        prevSelectedId.current = selectedId

        async function loadOverrides() {
            setLoadingMember(true)
            setError(null)
            try {
                const res = await fetch(`/api/members/${selectedId}/overrides`)
                if (!res.ok) throw new Error('Failed to load overrides')

                const data = await res.json() as {
                    member:      MemberInfo
                    roleId:      string
                    permissions: PermissionDetail[]
                }

                setMemberInfo(data.member)
                setRoleId(data.roleId)
                setGroups(groupPermissions(data.permissions))

                const map: OverrideMap = new Map()
                for (const p of data.permissions) map.set(p.id, p.overrideAllow)
                setSavedOverrides(new Map(map))
                setLocalOverrides(new Map(map))
            } catch (err) {
                setError((err as Error).message)
            } finally {
                setLoadingMember(false)
            }
        }
        loadOverrides()
    }, [selectedId])

    // Filter + search
    useEffect(() => {
        const q = search.toLowerCase().trim()
        const filtered = groups
            .map(g => {
                const moduleLabel = t(`modules.${g.module}` as Parameters<typeof t>[0]).toLowerCase()
                return {
                    module:      g.module,
                    permissions: g.permissions.filter(p => {
                        const matchSearch = !q ||
                            p.name.toLowerCase().includes(q) ||
                            p.code.toLowerCase().includes(q) ||
                            g.module.toLowerCase().includes(q) ||
                            moduleLabel.includes(q)
                        if (!matchSearch) return false

                        const localOverride = localOverrides.get(p.id) ?? null
                        const effective     = localOverride !== null ? localOverride : (p.roleAllow === true)
                        const hasOverride   = localOverride !== null

                        if (filter === 'granted')  return effective
                        if (filter === 'denied')   return !effective
                        if (filter === 'override') return hasOverride
                        return true
                    }),
                }
            })
            .filter(g => g.permissions.length > 0)
        setFilteredGroups(filtered)
    }, [search, groups, filter, localOverrides, t])

    // Members for Stage 2: filtered by selected role + member search
    const members = useMemo(() => {
        return allMembers.filter(m => {
            if (selectedRole && m.roleEnum !== selectedRole) return false
            if (!memberSearch.trim()) return true
            const q = memberSearch.toLowerCase()
            return (
                (m.name  ?? '').toLowerCase().includes(q) ||
                m.membershipId.toLowerCase().includes(q)  ||
                (m.email ?? '').toLowerCase().includes(q)
            )
        })
    }, [allMembers, selectedRole, memberSearch])

    function selectRole(roleEnum: string | null) {
        if (isDirty && !confirm('Ada perubahan yang belum disimpan. Lanjutkan?')) return
        setSelectedRole(roleEnum)
        setSelectedId(null)
        prevSelectedId.current = null
        setMemberSearch('')
        setMemberInfo(null)
        setGroups([])
        setFilteredGroups([])
        setSavedOverrides(new Map())
        setLocalOverrides(new Map())
        setSearch('')
        setFilter('all')
    }

    function selectMember(membershipId: string) {
        if (isDirty && !confirm('Ada perubahan yang belum disimpan. Lanjutkan?')) return
        prevSelectedId.current = null
        setSelectedId(membershipId)
        setSearch('')
        setFilter('all')
        setSavedOverrides(new Map())
        setLocalOverrides(new Map())
        setMemberInfo(null)
        setGroups([])
        setFilteredGroups([])
    }

    function setOverride(permissionId: string, value: boolean | null) {
        if (!canEdit) return
        setLocalOverrides(prev => {
            const next = new Map(prev)
            next.set(permissionId, value)
            return next
        })
    }

    function discardChanges() {
        setLocalOverrides(new Map(savedOverrides))
    }

    async function save(): Promise<boolean> {
        if (!selectedId || !roleId) return false
        setSaving(true)
        setError(null)
        try {
            const overrides: { permissionId: string; allow: boolean }[] = []
            for (const [permId, allow] of localOverrides) {
                if (allow !== null) overrides.push({ permissionId: permId, allow })
            }

            const res = await fetch(`/api/members/${selectedId}/overrides`, {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ roleId, overrides }),
            })

            if (!res.ok) {
                const body = await res.json() as { error?: string }
                throw new Error(body.error ?? res.statusText)
            }

            setSavedOverrides(new Map(localOverrides))
            return true
        } catch (err) {
            setError((err as Error).message)
            return false
        } finally {
            setSaving(false)
        }
    }

    return {
        singleMode,
        roleGroups,
        selectedRole,
        members,
        memberSearch,
        setMemberSearch,
        selectedId,
        memberInfo,
        roleId,
        filteredGroups,
        search,
        setSearch,
        filter,
        setFilter,
        localOverrides,
        savedOverrides,
        isDirty,
        dirtyCount,
        summary,
        loading,
        loadingMember,
        saving,
        error,
        selectRole,
        selectMember,
        setOverride,
        discardChanges,
        save,
    }
}
