/*
 * =============================================================================
 * 019_RBAC_TABLE_RLS
 *
 * Enables Row-Level Security on the four RBAC v2 tables created in
 * 011_rbac_tables.sql, which were left without RLS protection.
 *
 * Assessment finding (Sprint 5.1):
 *   roles, permissions, role_permissions — no RLS (low sensitivity, read-only)
 *   rt_permission_overrides              — no RLS (HIGH sensitivity: per-RT
 *     permission customizations readable/writable by any authenticated user
 *     who knows the table schema)
 *
 * Strategy per table:
 *
 *   roles / permissions
 *     Catalog data. Read-only by design; all writes go through seeder /
 *     service_role. Open SELECT for authenticated users is correct because
 *     the permission management UI requires these records to render.
 *     No INSERT/UPDATE/DELETE policies → default deny for authenticated writes.
 *
 *   role_permissions
 *     Global default grant table. Readable by authenticated users (permission
 *     matrix UI). No rt_id column → cannot use has_permission() for scoping.
 *     All writes go through supabaseAdmin (service_role), which bypasses RLS.
 *     No INSERT/UPDATE/DELETE policies → default deny for authenticated writes.
 *
 *   rt_permission_overrides
 *     Per-RT exception table — highest sensitivity. Scoped to
 *     has_permission(rt_id, 'permission.override'). has_permission() is
 *     SECURITY DEFINER so it bypasses RLS on this table internally — no
 *     circular dependency.
 *
 * Note on enabling RLS with no policies:
 *   ALTER TABLE ... ENABLE ROW LEVEL SECURITY defaults to deny-all for the
 *   affected role. The SELECT policies below are added in the same transaction
 *   to avoid a deny window.
 *
 * Dependencies : 011_rbac_tables, 012_rbac_seed, 013_rbac_functions
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * 1. roles — enable RLS + open authenticated read
 * --------------------------------------------------------------------------- */

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles: authenticated can read" ON roles;

CREATE POLICY "roles: authenticated can read"
    ON roles FOR SELECT TO authenticated
    USING (true);


/* ----------------------------------------------------------------------------
 * 2. permissions — enable RLS + open authenticated read
 * --------------------------------------------------------------------------- */

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "permissions: authenticated can read" ON permissions;

CREATE POLICY "permissions: authenticated can read"
    ON permissions FOR SELECT TO authenticated
    USING (true);


/* ----------------------------------------------------------------------------
 * 3. role_permissions — enable RLS + open authenticated read
 *    Writes are service_role-only (no authenticated INSERT/UPDATE/DELETE policy).
 * --------------------------------------------------------------------------- */

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "role_permissions: authenticated can read" ON role_permissions;

CREATE POLICY "role_permissions: authenticated can read"
    ON role_permissions FOR SELECT TO authenticated
    USING (true);


/* ----------------------------------------------------------------------------
 * 4. rt_permission_overrides — enable RLS + scoped to permission.override
 *    SELECT / INSERT / UPDATE / DELETE all require permission.override for
 *    the target RT. has_permission() is SECURITY DEFINER and bypasses RLS
 *    on this table when evaluating, so there is no circular dependency.
 * --------------------------------------------------------------------------- */

ALTER TABLE rt_permission_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rt_permission_overrides: view"   ON rt_permission_overrides;
DROP POLICY IF EXISTS "rt_permission_overrides: create" ON rt_permission_overrides;
DROP POLICY IF EXISTS "rt_permission_overrides: update" ON rt_permission_overrides;
DROP POLICY IF EXISTS "rt_permission_overrides: delete" ON rt_permission_overrides;

CREATE POLICY "rt_permission_overrides: view"
    ON rt_permission_overrides FOR SELECT TO authenticated
    USING (has_permission(rt_id, 'permission.override'));

CREATE POLICY "rt_permission_overrides: create"
    ON rt_permission_overrides FOR INSERT TO authenticated
    WITH CHECK (has_permission(rt_id, 'permission.override'));

CREATE POLICY "rt_permission_overrides: update"
    ON rt_permission_overrides FOR UPDATE TO authenticated
    USING     (has_permission(rt_id, 'permission.override'))
    WITH CHECK (has_permission(rt_id, 'permission.override'));

CREATE POLICY "rt_permission_overrides: delete"
    ON rt_permission_overrides FOR DELETE TO authenticated
    USING (has_permission(rt_id, 'permission.override'));
