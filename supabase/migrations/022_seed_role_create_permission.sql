/*
 * =============================================================================
 * 022_SEED_ROLE_CREATE_PERMISSION
 *
 * Adds the role.create permission to the catalog (added in PERMISSION_CATALOG.md
 * v2.1) and grants it to RT_ADMIN and SUPER_ADMIN role defaults.
 *
 * Dependencies : 012_rbac_permissions, 013_rbac_role_permissions,
 *                015_seed_roles, 016_seed_permissions
 * =============================================================================
 */

INSERT INTO permissions (code, name, description, is_system)
VALUES ('role.create', 'Create Role', 'Create custom role', true)
ON CONFLICT (code) DO NOTHING;

-- Grant role.create to RT_ADMIN and SUPER_ADMIN by default
INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles       r
JOIN   permissions p ON p.code = 'role.create'
WHERE  r.code IN ('RT_ADMIN', 'SUPER_ADMIN')
ON CONFLICT (role_id, permission_id) DO NOTHING;
