/*
 * =============================================================================
 * 012_RBAC_PERMISSIONS
 *
 * Creates the permissions table for RBAC v2.
 *
 * Permissions represent executable capabilities within the application.
 * They follow the naming convention: module.action (e.g. payment.approve).
 *
 * Permission codes are immutable identifiers and must never be renamed
 * after seeding. If a capability changes, deprecate the old permission
 * and create a new one.
 *
 * The complete permission catalog is defined in:
 *   docs/database/PERMISSION_CATALOG.md
 *
 * This table is intentionally empty after creation.
 * Seeding (full permission catalog) is handled by a separate migration (Phase 4).
 *
 * Dependencies : none
 * Referenced by: role_permissions, rt_permission_overrides
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * TABLE: permissions
 * --------------------------------------------------------------------------- */

CREATE TABLE IF NOT EXISTS permissions (
    id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    code        varchar(100) NOT NULL,
    name        varchar(150) NOT NULL,
    description text,
    is_system   boolean      NOT NULL DEFAULT false,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    updated_at  timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT permissions_code_unique UNIQUE (code)
);

COMMENT ON TABLE  permissions             IS 'RBAC v2 — permission catalog. code is the immutable identifier used by PermissionService and RLS.';
COMMENT ON COLUMN permissions.code        IS 'Immutable permission identifier following module.action convention (e.g. payment.approve). Never rename after seeding.';
COMMENT ON COLUMN permissions.is_system   IS 'System permissions are managed by KasWarga and must not be deleted by operators.';
