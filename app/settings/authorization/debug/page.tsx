export const dynamic = 'force-dynamic'

import { Suspense }                from 'react'
import { getRequestContext }       from '@/lib/auth/server'
import { PERMISSION }              from '@/lib/auth/types'
import { UnauthorizedError }       from '@/lib/auth/errors'
import ForbiddenState              from '@/components/ui/ForbiddenState'
import DebugPanelContainer         from '@/features/authorization/debug/DebugPanelContainer'
import type { DebugData, PermissionSource } from '@/features/authorization/debug/types'
import { listAllPermissions }      from '@/lib/repositories/permission.repository'
import {
    getRolePermissionMap,
    getRtOverrideMap,
    getRoleById,
} from '@/lib/repositories/member-override.repository'

export default async function Page() {
    try {
        const ctx  = await getRequestContext()
        const auth = ctx.authorization

        if (!auth.hasPermission(PERMISSION.DEBUG_VIEW)) {
            return <ForbiddenState />
        }

        const { userId, membershipId, neighborhoodId, roleId, roleCode } = auth

        const [allPermissions, rolePermMap, overrideMap, roleInfo] = await Promise.all([
            listAllPermissions(),
            getRolePermissionMap(roleId),
            getRtOverrideMap(neighborhoodId, roleId),
            getRoleById(roleId),
        ])

        let rolePermissionCount  = 0
        let overrideGrantCount   = 0
        let overrideRevokeCount  = 0
        let effectiveCount       = 0

        const permissionDetails = allPermissions.map(p => {
            const roleAllow     = rolePermMap.get(p.id) ?? null
            const overrideAllow = overrideMap.has(p.id) ? (overrideMap.get(p.id) ?? null) : null

            let source:    PermissionSource
            let effective: boolean

            if (overrideAllow === true) {
                source    = 'override_grant'
                effective = true
                overrideGrantCount++
            } else if (overrideAllow === false) {
                source    = 'override_revoke'
                effective = false
                overrideRevokeCount++
            } else if (roleAllow === true) {
                source    = 'role'
                effective = true
                rolePermissionCount++
            } else {
                source    = 'none'
                effective = false
            }

            if (effective) effectiveCount++

            return {
                id:        p.id,
                code:      p.code,
                name:      p.name,
                module:    p.code.split('.')[0] ?? 'other',
                effective,
                source,
            }
        })

        const debugData: DebugData = {
            userId,
            membershipId,
            neighborhoodId,
            roleCode,
            roleId,
            roleName: roleInfo?.name ?? roleCode,

            requestId: ctx.requestId,
            locale:    ctx.locale,
            timezone:  ctx.timezone,
            ipAddress: ctx.ipAddress,
            userAgent: ctx.userAgent,

            rolePermissionCount,
            overrideGrantCount,
            overrideRevokeCount,
            effectiveCount,

            permissionDetails,

            currentPath:         '/settings/authorization/debug',
            method:              'GET',
            requiredPermission:  PERMISSION.DEBUG_VIEW,
            authorizationResult: 'GRANTED',

            generatedAt: new Date().toISOString(),
        }

        return (
            <Suspense>
                <DebugPanelContainer debugData={debugData} />
            </Suspense>
        )
    } catch (err) {
        if (err instanceof UnauthorizedError) {
            return <ForbiddenState />
        }
        throw err
    }
}
