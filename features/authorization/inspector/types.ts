export interface RoleWithCount {
    id:           string
    code:         string
    name:         string
    member_count: number
}

export interface PermissionDetails {
    grantedRoles:         RoleWithCount[]
    overrideGrants:       RoleWithCount[]
    overrideRevokes:      RoleWithCount[]
    effectiveMemberCount: number
    stats: {
        roleCount:       number
        totalMembers:    number
        overrideCount:   number
        grantOverrides:  number
        revokeOverrides: number
    }
}

export type InspectorTab = 'permission' | 'member'
