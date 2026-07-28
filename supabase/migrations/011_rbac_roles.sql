/*
 * =============================================================================
 * 011_RBAC_ROLES
 *
 * Creates the roles table for RBAC v2.
 *
 * Roles are the foundational unit of the RBAC model. Every role has an
 * immutable code that is referenced throughout the application. Role names
 * and descriptions are localizable and may change; the code never changes.
 *
 * This table is intentionally empty after creation.
 * Seeding (default roles) is handled by a separate migration (Phase 4).
 *
 * Dependencies : none
 * Referenced by: role_permissions, rt_permission_overrides
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * TABLE: roles
 * --------------------------------------------------------------------------- */

CREATE TABLE IF NOT EXISTS roles (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    code        varchar(50) NOT NULL,
    name        text        NOT NULL,
    description text,
    is_system   boolean     NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT roles_code_unique UNIQUE (code)
);

COMMENT ON TABLE  roles            IS 'RBAC v2 — role definitions. code is the immutable identifier used throughout the application.';
COMMENT ON COLUMN roles.code       IS 'Immutable role identifier (e.g. RT_ADMIN, TREASURER). Never rename after seeding.';
COMMENT ON COLUMN roles.is_system  IS 'System roles are managed by KasWarga and must not be deleted or renamed by operators.';
