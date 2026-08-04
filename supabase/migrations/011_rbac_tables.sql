/*
 * =============================================================================
 * 011_RBAC_TABLES
 *
 * Creates all RBAC v2 tables in dependency order:
 *   roles → permissions → role_permissions → rt_permission_overrides
 *
 * All tables are idempotent (CREATE TABLE IF NOT EXISTS).
 *
 * Dependencies : rt (000)
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * TABLE: roles
 *
 * Foundational unit of the RBAC model. Every role has an immutable code
 * referenced throughout the application. Names and descriptions may change;
 * the code never does.
 * --------------------------------------------------------------------------- */

CREATE TABLE IF NOT EXISTS roles (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    code        varchar(50) NOT NULL,
    name        text        NOT NULL,
    description text,
    is_system   boolean     NOT NULL DEFAULT false,
    is_active   boolean     NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT roles_code_unique UNIQUE (code)
);

COMMENT ON TABLE  roles            IS 'RBAC v2 — role definitions. code is the immutable identifier used throughout the application.';
COMMENT ON COLUMN roles.code       IS 'Immutable role identifier (e.g. RT_ADMIN, TREASURER). Never rename after seeding.';
COMMENT ON COLUMN roles.is_system  IS 'System roles are managed by KasWarga and must not be deleted or renamed by operators.';
COMMENT ON COLUMN roles.is_active  IS 'Inactive roles cannot be assigned and are hidden from management UIs.';


/* ----------------------------------------------------------------------------
 * TABLE: permissions
 *
 * Executable capabilities within the application.
 * Naming convention: module.action (e.g. payment.approve).
 * Codes are immutable; deprecate and add rather than rename.
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

COMMENT ON TABLE  permissions           IS 'RBAC v2 — permission catalog. code is the immutable identifier used by PermissionService and RLS.';
COMMENT ON COLUMN permissions.code      IS 'Immutable permission identifier following module.action convention (e.g. payment.approve). Never rename after seeding.';
COMMENT ON COLUMN permissions.is_system IS 'System permissions are managed by KasWarga and must not be deleted by operators.';


/* ----------------------------------------------------------------------------
 * TABLE: role_permissions
 *
 * Default permission grants per role. Global — applies to every RT equally.
 * RT-level customization is handled exclusively by rt_permission_overrides.
 *
 * Resolution order:
 *   1. Resolve user role
 *   2. Load role_permissions (this table)
 *   3. Apply rt_permission_overrides
 *   4. Produce effective permission
 *
 * Missing row = Denied (closed by default).
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

COMMENT ON TABLE  role_permissions       IS 'RBAC v2 — default permission assignments per role. Global; not RT-specific.';
COMMENT ON COLUMN role_permissions.allow IS 'true = permission granted, false = permission explicitly denied.';

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id
    ON role_permissions(role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id
    ON role_permissions(permission_id);


/* ----------------------------------------------------------------------------
 * TABLE: rt_permission_overrides
 *
 * RT-specific exceptions to the global role_permissions defaults.
 * Only exceptions are stored; absence of a row means use the role default.
 *
 * Overrides are created exclusively by RT administrators at runtime.
 * The seeder must never insert rows into this table.
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

COMMENT ON TABLE  rt_permission_overrides       IS 'RBAC v2 — RT-specific permission overrides. Only exceptions from role_permissions defaults are stored.';
COMMENT ON COLUMN rt_permission_overrides.allow IS 'true = grant override, false = revoke override. Absence of row means use role_permissions default.';
COMMENT ON COLUMN rt_permission_overrides.rt_id IS 'The RT whose permission policy is being customized.';

CREATE INDEX IF NOT EXISTS idx_rt_permission_overrides_rt_id
    ON rt_permission_overrides(rt_id);

CREATE INDEX IF NOT EXISTS idx_rt_permission_overrides_role_id
    ON rt_permission_overrides(role_id);

CREATE INDEX IF NOT EXISTS idx_rt_permission_overrides_permission_id
    ON rt_permission_overrides(permission_id);
