export type PermissionSource = 'role' | 'override_grant' | 'override_revoke' | 'none'

export interface PermissionDetail {
    id:        string
    code:      string
    name:      string
    module:    string
    effective: boolean
    source:    PermissionSource
}

export interface DebugData {
    userId:         string
    membershipId:   string
    neighborhoodId: string
    roleCode:       string
    roleId:         string
    roleName:       string

    requestId: string
    locale:    string
    timezone:  string
    ipAddress: string
    userAgent: string

    rolePermissionCount:  number
    overrideGrantCount:   number
    overrideRevokeCount:  number
    effectiveCount:       number

    permissionDetails: PermissionDetail[]

    currentPath:         string
    method:              string
    requiredPermission:  string
    authorizationResult: 'GRANTED'

    generatedAt: string
}
