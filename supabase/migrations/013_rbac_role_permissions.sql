/*
 * =============================================================================
 * 013_RBAC_ROLE_PERMISSIONS
 *
 * Creates the role_permissions junction table for RBAC v2.
 *
 * Role Permissions define the default authorization model of KasWarga.
 * They represent the baseline permissions granted to every role before any
 * RT-specific customization (permission_overrides) is applied.
 *
 * Role permissions are global — they apply to every RT equally.
 * RT-level customization is handled exclusively by rt_permission_overrides.
 *
 * Resolution order:
 *   1. Resolve User Role
 *   2. Load Role Permissions (this table)
 *   3. Apply RT Permission Overrides
 *   4. Produce Effective Permission
 *
 * Missing permission = Denied (closed by default).
 *
 * This table is intentionally empty after creation.
 * Seeding (default role-permission assignments) is handled by a separate
 * migration (Phase 4) following DEFAULT_ROLE_MATRIX.md.
 *
 * Dependencies : roles (011), permissions (012)
 * Referenced by: rt_permission_overrides (runtime resolution)
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * TABLE: role_permissions
 * --------------------------------------------------------------------------- */

CREATE TABLE IF NOT EXISTS role_permissions (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id       uuid        NOT NULL REFERENCES roles(id)       ON DELETE CASCADE,
    permission_id uuid        NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    allow         boolean     NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT role_permissions_unique UNIQUE (role_id, permission_id)
);

COMMENT ON TABLE  role_permissions            IS 'RBAC v2 — default permission assignments per role. Global; not RT-specific.';
COMMENT ON COLUMN role_permissions.allow      IS 'true = permission granted, false = permission explicitly denied.';


/* ----------------------------------------------------------------------------
 * INDEXES
 * Individual FK indexes speed up queries that filter on a single column.
 * The composite UNIQUE constraint already covers (role_id, permission_id).
 * --------------------------------------------------------------------------- */

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id
    ON role_permissions(role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id
    ON role_permissions(permission_id);
