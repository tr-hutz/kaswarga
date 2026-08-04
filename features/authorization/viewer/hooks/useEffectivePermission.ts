'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { MemberRow } from '@/lib/repositories/member-override.repository'

export type ViewerFilter = 'all' | 'granted' | 'denied' | 'override' | 'role'
export type ViewerSort   = 'module' | 'name' | 'effective'
export type PermissionSource = 'role' | 'override_grant' | 'override_revoke' | 'none'

export interface PermissionViewRow {
    id:            string
    code:          string
    name:          string
    description:   string | null
    module:        string
    roleAllow:     boolean | null
    overrideAllow: boolean | null
    effective:     boolean
    source:        PermissionSource
    reason:        string
}

export interface ViewerMemberInfo {
    membershipId: string
    userId:       string
    name:         string | null
    email:        string | null
    roleCode:     string
    roleName:     string
    status:       string
}

export interface ViewerSummary {
    granted:   number
    denied:    number
    overrides: number
    total:     number
}

export interface RoleGroup {
    roleEnum: string
    count:    number
}

interface ApiPermission {
    id:            string
    code:          string
    name:          string
    description:   string | null
    roleAllow:     boolean | null
    overrideAllow: boolean | null
}

interface ApiOverridesResponse {
    member:      ViewerMemberInfo
    roleId:      string
    permissions: ApiPermission[]
}

function computeSource(roleAllow: boolean | null, overrideAllow: boolean | null): PermissionSource {
    if (overrideAllow === true)  return 'override_grant'
    if (overrideAllow === false) return 'override_revoke'
    if (roleAllow === true)      return 'role'
    return 'none'
}

export function useEffectivePermission() {
    const t = useTranslations('viewer')

    const [allMembers,    setAllMembers]    = useState<MemberRow[]>([])
    const [memberSearch,  setMemberSearch]  = useState('')
    const [roleFilter,    setRoleFilter]    = useState('all')
    const [selectedId,    setSelectedId]    = useState<string | null>(null)
    const [memberInfo,    setMemberInfo]    = useState<ViewerMemberInfo | null>(null)
    const [allRows,       setAllRows]       = useState<PermissionViewRow[]>([])
    const [search,        setSearch]        = useState('')
    const [filter,        setFilter]        = useState<ViewerFilter>('all')
    const [sort,          setSort]          = useState<ViewerSort>('module')
    const [expanded,      setExpanded]      = useState<Set<string>>(new Set())
    const [loading,       setLoading]       = useState(true)
    const [loadingMember, setLoadingMember] = useState(false)
    const [error,         setError]         = useState<string | null>(null)

    useEffect(() => {
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
    }, [])

    const prevSelectedId = useRef<string | null>(null)
    useEffect(() => {
        if (!selectedId || selectedId === prevSelectedId.current) return
        prevSelectedId.current = selectedId

        async function load() {
            setLoadingMember(true)
            setError(null)
            try {
                const res = await fetch(`/api/members/${selectedId}/overrides`)
                if (!res.ok) throw new Error('Failed to load permissions')
                const data = await res.json() as ApiOverridesResponse

                setMemberInfo(data.member)

                const rows: PermissionViewRow[] = data.permissions.map(p => {
                    const source    = computeSource(p.roleAllow, p.overrideAllow)
                    const effective = p.overrideAllow !== null ? p.overrideAllow : (p.roleAllow === true)
                    const module    = p.code.split('.')[0] ?? 'other'
                    const reason    = t(`reason.${source}` as Parameters<typeof t>[0])
                    return {
                        id: p.id, code: p.code, name: p.name, description: p.description,
                        module, roleAllow: p.roleAllow, overrideAllow: p.overrideAllow,
                        effective, source, reason,
                    }
                })
                setAllRows(rows)
                setExpanded(new Set())
                setSearch('')
                setFilter('all')
                setSort('module')
            } catch (err) {
                setError((err as Error).message)
            } finally {
                setLoadingMember(false)
            }
        }
        load()
    }, [selectedId, t])

    const summary: ViewerSummary = useMemo(() => {
        let granted = 0, denied = 0, overrides = 0
        for (const row of allRows) {
            if (row.effective) granted++; else denied++
            if (row.overrideAllow !== null) overrides++
        }
        return { granted, denied, overrides, total: allRows.length }
    }, [allRows])

    const filteredRows = useMemo(() => {
        let rows = [...allRows]

        switch (filter) {
            case 'granted':  rows = rows.filter(r => r.effective); break
            case 'denied':   rows = rows.filter(r => !r.effective); break
            case 'override': rows = rows.filter(r => r.overrideAllow !== null); break
            case 'role':     rows = rows.filter(r => r.overrideAllow === null && r.roleAllow === true); break
        }

        if (search.trim()) {
            const q = search.toLowerCase()
            rows = rows.filter(r =>
                r.name.toLowerCase().includes(q) ||
                r.code.toLowerCase().includes(q) ||
                r.module.toLowerCase().includes(q)
            )
        }

        switch (sort) {
            case 'module':
                rows.sort((a, b) => a.module.localeCompare(b.module) || a.name.localeCompare(b.name))
                break
            case 'name':
                rows.sort((a, b) => a.name.localeCompare(b.name))
                break
            case 'effective':
                rows.sort((a, b) => (b.effective ? 1 : 0) - (a.effective ? 1 : 0) || a.name.localeCompare(b.name))
                break
        }

        return rows
    }, [allRows, filter, search, sort])

    const filteredMembers = useMemo(() => {
        return allMembers.filter(m => {
            if (roleFilter !== 'all' && m.roleEnum !== roleFilter) return false
            if (!memberSearch.trim()) return true
            const q = memberSearch.toLowerCase()
            return (
                (m.name  ?? '').toLowerCase().includes(q) ||
                m.membershipId.toLowerCase().includes(q)  ||
                (m.email ?? '').toLowerCase().includes(q)
            )
        })
    }, [allMembers, memberSearch, roleFilter])

    const roleGroups: RoleGroup[] = useMemo(() => {
        const map = new Map<string, number>()
        for (const m of allMembers) map.set(m.roleEnum, (map.get(m.roleEnum) ?? 0) + 1)
        return Array.from(map.entries()).map(([roleEnum, count]) => ({ roleEnum, count }))
    }, [allMembers])

    function selectMember(membershipId: string) {
        prevSelectedId.current = null
        setSelectedId(membershipId)
        setMemberInfo(null)
        setAllRows([])
        setExpanded(new Set())
    }

    function refresh() {
        if (!selectedId) return
        prevSelectedId.current = null
        setAllRows([])
        setMemberInfo(null)
        setExpanded(new Set())
    }

    function toggleExpanded(permId: string) {
        setExpanded(prev => {
            const next = new Set(prev)
            if (next.has(permId)) next.delete(permId)
            else next.add(permId)
            return next
        })
    }

    function exportCsv() {
        if (!memberInfo || filteredRows.length === 0) return
        const headers = ['Permission', 'Code', 'Module', 'Source', 'Effective', 'Reason']
        const csvRows = filteredRows.map(r => [
            r.name, r.code, r.module, r.source,
            r.effective ? 'Granted' : 'Denied', r.reason,
        ])
        const csv = [headers, ...csvRows]
            .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
            .join('\n')
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `effective-permissions-${(memberInfo.name ?? 'member').replace(/\s+/g, '-')}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return {
        roleGroups, filteredMembers, memberSearch, setMemberSearch,
        roleFilter, setRoleFilter, selectedId, selectMember,
        memberInfo, filteredRows, summary,
        search, setSearch, filter, setFilter, sort, setSort,
        expanded, toggleExpanded,
        loading, loadingMember, error,
        refresh, exportCsv,
    }
}
