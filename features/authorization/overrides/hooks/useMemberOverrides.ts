'use client'

import { useEffect, useState } from 'react'
import { useTranslations }     from 'next-intl'
import type { MemberRow }      from '@/lib/repositories/member-override.repository'

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

export function useMemberOverrides(canEdit: boolean) {
    const t = useTranslations('overrides')

    const [members,        setMembers]        = useState<MemberRow[]>([])
    const [memberSearch,   setMemberSearch]   = useState('')
    const [selectedId,     setSelectedId]     = useState<string | null>(null)
    const [memberInfo,     setMemberInfo]     = useState<MemberInfo | null>(null)
    const [roleId,         setRoleId]         = useState<string>('')
    const [groups,         setGroups]         = useState<PermissionGroup[]>([])
    const [filteredGroups, setFilteredGroups] = useState<PermissionGroup[]>([])
    const [search,         setSearch]         = useState('')
    const [savedOverrides, setSavedOverrides] = useState<OverrideMap>(new Map())
    const [localOverrides, setLocalOverrides] = useState<OverrideMap>(new Map())
    const [loading,        setLoading]        = useState(true)
    const [loadingMember,  setLoadingMember]  = useState(false)
    const [saving,         setSaving]         = useState(false)
    const [error,          setError]          = useState<string | null>(null)

    const isDirty = !overrideMapsEqual(localOverrides, savedOverrides)

    useEffect(() => {
        function onBeforeUnload(e: BeforeUnloadEvent) {
            if (isDirty) e.preventDefault()
        }
        window.addEventListener('beforeunload', onBeforeUnload)
        return () => window.removeEventListener('beforeunload', onBeforeUnload)
    }, [isDirty])

    // Load members on mount
    useEffect(() => {
        async function init() {
            setLoading(true)
            setError(null)
            try {
                const res = await fetch('/api/members')
                if (!res.ok) throw new Error('Failed to load members')
                const data = await res.json() as MemberRow[]
                setMembers(data)
            } catch (err) {
                setError((err as Error).message)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [])

    // Load overrides when selected member changes
    useEffect(() => {
        if (!selectedId) return

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

                const grps = groupPermissions(data.permissions)
                setGroups(grps)

                const overrideMap: OverrideMap = new Map()
                for (const p of data.permissions) {
                    overrideMap.set(p.id, p.overrideAllow)
                }
                setSavedOverrides(new Map(overrideMap))
                setLocalOverrides(new Map(overrideMap))
            } catch (err) {
                setError((err as Error).message)
            } finally {
                setLoadingMember(false)
            }
        }
        loadOverrides()
    }, [selectedId])

    // Filter by search
    useEffect(() => {
        if (!search.trim()) {
            setFilteredGroups(groups)
            return
        }
        const q = search.toLowerCase()
        const filtered = groups
            .map(g => {
                const moduleLabel = t(`modules.${g.module}` as Parameters<typeof t>[0]).toLowerCase()
                return {
                    module:      g.module,
                    permissions: g.permissions.filter(
                        p => p.name.toLowerCase().includes(q) ||
                             p.code.toLowerCase().includes(q) ||
                             g.module.toLowerCase().includes(q) ||
                             moduleLabel.includes(q)
                    ),
                }
            })
            .filter(g => g.permissions.length > 0)
        setFilteredGroups(filtered)
    }, [search, groups])

    const filteredMembers = members.filter(m => {
        if (!memberSearch.trim()) return true
        const q = memberSearch.toLowerCase()
        return (
            (m.name  ?? '').toLowerCase().includes(q) ||
            m.membershipId.toLowerCase().includes(q)  ||
            (m.email ?? '').toLowerCase().includes(q)
        )
    })

    function selectMember(membershipId: string) {
        if (isDirty && !confirm('Ada perubahan yang belum disimpan. Lanjutkan?')) return
        setSelectedId(membershipId)
        setSearch('')
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
                if (allow !== null) {
                    overrides.push({ permissionId: permId, allow })
                }
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
        members: filteredMembers,
        memberSearch,
        setMemberSearch,
        selectedId,
        memberInfo,
        roleId,
        filteredGroups,
        search,
        setSearch,
        localOverrides,
        isDirty,
        loading,
        loadingMember,
        saving,
        error,
        selectMember,
        setOverride,
        discardChanges,
        save,
    }
}
