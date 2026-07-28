/*
 * =============================================================================
 * 014_RBAC_PERMISSION_OVERRIDES
 *
 * Creates the rt_permission_overrides table for RBAC v2.
 *
 * Permission Overrides allow each RT to customize the default role permissions
 * without modifying the global role_permissions table.
 *
 * Only exceptions from the default are stored here.
 * If no override exists for a (rt, role, permission) combination,
 * the role_permissions default is used.
 *
 * An override may:
 *   - Grant a permission that is denied by default
 *   - Revoke a permission that is granted by default
 *
 * Deleting an override restores the default permission automatically
 * without any application-level intervention.
 *
 * The Seeder must never insert rows into this table.
 * Overrides are created exclusively by RT administrators at runtime.
 *
 * Dependencies : rt (000), roles (011), permissions (012)
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * TABLE: rt_permission_overrides
 * --------------------------------------------------------------------------- */

CREATE TABLE IF NOT EXISTS rt_permission_overrides (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    rt_id         uuid        NOT NULL REFERENCES rt(id)          ON DELETE CASCADE,
    role_id       uuid        NOT NULL REFERENCES roles(id)       ON DELETE CASCADE,
    permission_id uuid        NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    allow         boolean     NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT rt_permission_overrides_unique UNIQUE (rt_id, role_id, permission_id)
);

COMMENT ON TABLE  rt_permission_overrides            IS 'RBAC v2 — RT-specific permission overrides. Only exceptions from role_permissions defaults are stored.';
COMMENT ON COLUMN rt_permission_overrides.allow      IS 'true = grant override, false = revoke override. Absence of row means use role_permissions default.';
COMMENT ON COLUMN rt_permission_overrides.rt_id      IS 'The RT whose permission policy is being customized.';


/* ----------------------------------------------------------------------------
 * INDEXES
 * Queries filter primarily by rt_id (all overrides for an RT during auth
 * context construction), secondarily by role_id and permission_id.
 * --------------------------------------------------------------------------- */

CREATE INDEX IF NOT EXISTS idx_rt_permission_overrides_rt_id
    ON rt_permission_overrides(rt_id);

CREATE INDEX IF NOT EXISTS idx_rt_permission_overrides_role_id
    ON rt_permission_overrides(role_id);

CREATE INDEX IF NOT EXISTS idx_rt_permission_overrides_permission_id
    ON rt_permission_overrides(permission_id);
