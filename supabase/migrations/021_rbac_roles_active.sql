/*
 * =============================================================================
 * 021_RBAC_ROLES_ACTIVE
 *
 * Adds is_active to the roles table to support activate/deactivate operations
 * in the Role Management UI.
 *
 * System roles can be deactivated by operators but the UI enforces protection
 * logic to warn before deactivating a system role.
 *
 * Dependencies : 011_rbac_roles, 015_seed_roles
 * =============================================================================
 */

ALTER TABLE roles
    ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN roles.is_active IS
    'When false, the role is disabled and members holding it cannot log in with its permissions.';
