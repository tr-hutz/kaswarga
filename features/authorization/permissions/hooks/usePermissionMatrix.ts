'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PermissionRow }  from '@/lib/repositories/permission.repository'
import type { RoleRow }        from '@/lib/repositories/role.repository'
import type { PageResult }     from '@/lib/types/query'

export interface PermissionGroup {
    module:      string
    permissions: PermissionRow[]
}

function groupPermissions(permissions: PermissionRow[]): PermissionGroup[] {
    const map = new Map<string, PermissionRow[]>()
    for (const p of permissions) {
        const module = p.code.split('.')[0] ?? 'other'
        const list   = map.get(module) ?? []
        list.push(p)
        map.set(module, list)
    }
    return Array.from(map.entries()).map(([module, perms]) => ({ module, permissions: perms }))
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false
    for (const v of a) if (!b.has(v)) return false
    return true
}

export function usePermissionMatrix(canEdit: boolean) {

    const [roles,          setRoles]          = useState<RoleRow[]>([])
    const [selectedRoleId, setSelectedRoleId] = useState<string>('')
    const [allPermissions, setAllPermissions] = useState<PermissionRow[]>([])
    const [groups,         setGroups]         = useState<PermissionGroup[]>([])
    const [filteredGroups, setFilteredGroups] = useState<PermissionGroup[]>([])
    const [savedSet,       setSavedSet]       = useState<Set<string>>(new Set())
    const [localSet,       setLocalSet]       = useState<Set<string>>(new Set())
    const [collapsed,      setCollapsed]      = useState<Set<string>>(new Set())
    const [search,         setSearch]         = useState('')
    const [loading,        setLoading]        = useState(true)
    const [saving,         setSaving]         = useState(false)
    const [loadingRole,    setLoadingRole]     = useState(false)
    const [error,          setError]          = useState<string | null>(null)

    const isDirty = !setsEqual(localSet, savedSet)

    // Confirm before leaving if dirty
    useEffect(() => {
        function onBeforeUnload(e: BeforeUnloadEvent) {
            if (isDirty) { e.preventDefault() }
        }
        window.addEventListener('beforeunload', onBeforeUnload)
        return () => window.removeEventListener('beforeunload', onBeforeUnload)
    }, [isDirty])

    // Load all roles + permissions on mount
    useEffect(() => {
        async function init() {
            setLoading(true)
            setError(null)
            try {
                const [rolesRes, permsRes] = await Promise.all([
                    fetch('/api/roles?pageSize=100&sortBy=name'),
                    fetch('/api/permissions'),
                ])
                if (!rolesRes.ok || !permsRes.ok) throw new Error('Failed to load data')

                const rolesData  = await rolesRes.json()  as PageResult<RoleRow>
                const permsData  = await permsRes.json()  as PermissionRow[]

                setRoles(rolesData.data)
                setAllPermissions(permsData)
                setGroups(groupPermissions(permsData))

                if (rolesData.data.length > 0) {
                    setSelectedRoleId(rolesData.data[0].id)
                }
            } catch (err) {
                setError((err as Error).message)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [])

    // Load role permissions when selected role changes
    const prevRoleId = useRef('')
    useEffect(() => {
        if (!selectedRoleId || selectedRoleId === prevRoleId.current) return
        prevRoleId.current = selectedRoleId

        async function loadRolePerms() {
            setLoadingRole(true)
            try {
                const res = await fetch(`/api/roles/${selectedRoleId}/permissions`)
                if (!res.ok) throw new Error('Failed to load role permissions')
                const data = await res.json() as { permission_id: string; allow: boolean }[]
                const ids  = new Set(data.filter(r => r.allow).map(r => r.permission_id))
                setSavedSet(ids)
                setLocalSet(new Set(ids))
            } catch (err) {
                setError((err as Error).message)
            } finally {
                setLoadingRole(false)
            }
        }
        loadRolePerms()
    }, [selectedRoleId])

    // Filter groups by search
    useEffect(() => {
        if (!search.trim()) {
            setFilteredGroups(groups)
            return
        }
        const q = search.toLowerCase()
        const filtered = groups
            .map(g => ({
                module:      g.module,
                permissions: g.permissions.filter(
                    p => p.name.toLowerCase().includes(q) ||
                         p.code.toLowerCase().includes(q) ||
                         g.module.toLowerCase().includes(q)
                ),
            }))
            .filter(g => g.permissions.length > 0)
        setFilteredGroups(filtered)
    }, [search, groups])

    function handleRoleChange(roleId: string) {
        if (isDirty) {
            if (!confirm('Kamu memiliki perubahan yang belum disimpan. Lanjutkan?')) return
        }
        setSelectedRoleId(roleId)
        prevRoleId.current = ''
    }

    function togglePermission(permId: string) {
        if (!canEdit) return
        setLocalSet(prev => {
            const next = new Set(prev)
            if (next.has(permId)) next.delete(permId)
            else next.add(permId)
            return next
        })
    }

    function selectAllInModule(module: string) {
        if (!canEdit) return
        const group = groups.find(g => g.module === module)
        if (!group) return
        setLocalSet(prev => {
            const next = new Set(prev)
            for (const p of group.permissions) next.add(p.id)
            return next
        })
    }

    function clearAllInModule(module: string) {
        if (!canEdit) return
        const group = groups.find(g => g.module === module)
        if (!group) return
        setLocalSet(prev => {
            const next = new Set(prev)
            for (const p of group.permissions) next.delete(p.id)
            return next
        })
    }

    function toggleCollapse(module: string) {
        setCollapsed(prev => {
            const next = new Set(prev)
            if (next.has(module)) next.delete(module)
            else next.add(module)
            return next
        })
    }

    async function save(): Promise<boolean> {
        if (!selectedRoleId) return false
        setSaving(true)
        try {
            const res = await fetch(`/api/roles/${selectedRoleId}/permissions`, {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ permissionIds: Array.from(localSet) }),
            })
            if (!res.ok) {
                const body = await res.json() as { error?: string }
                throw new Error(body.error ?? res.statusText)
            }
            setSavedSet(new Set(localSet))
            return true
        } catch (err) {
            setError((err as Error).message)
            return false
        } finally {
            setSaving(false)
        }
    }

    function discardChanges() {
        setLocalSet(new Set(savedSet))
    }

    return {
        roles,
        selectedRoleId,
        selectedRole:   roles.find(r => r.id === selectedRoleId) ?? null,
        allPermissions,
        filteredGroups,
        localSet,
        collapsed,
        search,
        isDirty,
        loading,
        loadingRole,
        saving,
        error,
        handleRoleChange,
        togglePermission,
        selectAllInModule,
        clearAllInModule,
        toggleCollapse,
        setSearch,
        save,
        discardChanges,
    }
}
