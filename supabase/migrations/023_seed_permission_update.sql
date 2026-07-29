/*
 * =============================================================================
 * 023_SEED_PERMISSION_UPDATE
 *
 * Adds the permission.update permission to the catalog.
 * This permission gates editing global role-permission assignments (the Matrix).
 * It is distinct from permission.override which gates RT-specific overrides.
 *
 * Dependencies : 012_rbac_permissions, 013_rbac_role_permissions,
 *                015_seed_roles, 016_seed_permissions
 * =============================================================================
 */

INSERT INTO permissions (code, name, description, is_system)
VALUES ('permission.update', 'Edit Permission Matrix', 'Edit global role-permission assignments', true)
ON CONFLICT (code) DO NOTHING;

-- Grant permission.update to RT_ADMIN and SUPER_ADMIN
INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles       r
JOIN   permissions p ON p.code = 'permission.update'
WHERE  r.code IN ('RT_ADMIN', 'SUPER_ADMIN')
ON CONFLICT (role_id, permission_id) DO NOTHING;
