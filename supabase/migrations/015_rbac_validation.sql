/*
 * =============================================================================
 * 015_RBAC_VALIDATION
 *
 * Asserts that the full RBAC v2 database foundation is consistent.
 * Any failing assertion raises an exception and rolls back this migration,
 * preventing a broken state from being committed.
 *
 * Checks performed
 *   1. Core RBAC tables exist
 *   2. Authorization functions exist with correct signatures
 *   3. Seed data — roles (6), permissions (47), role_permissions (97)
 *   4. Key business rules — SUPER_ADMIN excluded, permission grants correct
 *   5. Updated RLS policies are present; deprecated role-name policies are gone
 *
 * Dependencies : 011–014 (all prior RBAC v2 migrations)
 * =============================================================================
 */

DO $$
DECLARE
    v_count bigint;
BEGIN

    /* ---------------------------------------------------------------------- */
    /* 1. Core RBAC tables                                                     */
    /* ---------------------------------------------------------------------- */

    ASSERT (SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'roles'
    )), 'Table roles not found';

    ASSERT (SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'permissions'
    )), 'Table permissions not found';

    ASSERT (SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'role_permissions'
    )), 'Table role_permissions not found';

    ASSERT (SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'rt_permission_overrides'
    )), 'Table rt_permission_overrides not found';

    -- is_active column must exist on roles
    ASSERT (SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'roles'
          AND column_name  = 'is_active'
    )), 'Column roles.is_active not found';


    /* ---------------------------------------------------------------------- */
    /* 2. Authorization functions                                              */
    /* ---------------------------------------------------------------------- */

    ASSERT (SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.proname = 'has_permission'
          AND n.nspname  = 'public'
          AND p.pronargs  = 2
    )), 'Function has_permission(uuid, text) not found in public schema';

    ASSERT (SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.proname = 'current_membership'
          AND n.nspname  = 'public'
    )), 'Function current_membership() not found in public schema';

    ASSERT (SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.proname = 'current_neighborhood'
          AND n.nspname  = 'public'
    )), 'Function current_neighborhood() not found in public schema';


    /* ---------------------------------------------------------------------- */
    /* 3. Seed data — counts                                                   */
    /* ---------------------------------------------------------------------- */

    -- 6 system roles
    SELECT COUNT(*) INTO v_count FROM roles;
    ASSERT v_count = 6,
        format('Expected 6 roles, found %s', v_count);

    -- 47 system permissions
    SELECT COUNT(*) INTO v_count FROM permissions;
    ASSERT v_count = 47,
        format('Expected 47 permissions, found %s', v_count);

    -- 97 role-permission assignments
    --   RT_ADMIN=38, RT_CHAIR=23, TREASURER=20, SECRETARY=10, RESIDENT=6
    SELECT COUNT(*) INTO v_count FROM role_permissions;
    ASSERT v_count = 97,
        format('Expected 97 role_permissions rows, found %s', v_count);

    -- Per-role counts
    SELECT COUNT(rp.id) INTO v_count
    FROM role_permissions rp JOIN roles r ON r.id = rp.role_id
    WHERE r.code = 'RT_ADMIN';
    ASSERT v_count = 38,
        format('RT_ADMIN: expected 38 permissions, found %s', v_count);

    SELECT COUNT(rp.id) INTO v_count
    FROM role_permissions rp JOIN roles r ON r.id = rp.role_id
    WHERE r.code = 'RT_CHAIR';
    ASSERT v_count = 23,
        format('RT_CHAIR: expected 23 permissions, found %s', v_count);

    SELECT COUNT(rp.id) INTO v_count
    FROM role_permissions rp JOIN roles r ON r.id = rp.role_id
    WHERE r.code = 'TREASURER';
    ASSERT v_count = 20,
        format('TREASURER: expected 20 permissions, found %s', v_count);

    SELECT COUNT(rp.id) INTO v_count
    FROM role_permissions rp JOIN roles r ON r.id = rp.role_id
    WHERE r.code = 'SECRETARY';
    ASSERT v_count = 10,
        format('SECRETARY: expected 10 permissions, found %s', v_count);

    SELECT COUNT(rp.id) INTO v_count
    FROM role_permissions rp JOIN roles r ON r.id = rp.role_id
    WHERE r.code = 'RESIDENT';
    ASSERT v_count = 6,
        format('RESIDENT: expected 6 permissions, found %s', v_count);


    /* ---------------------------------------------------------------------- */
    /* 4. Business rule invariants                                             */
    /* ---------------------------------------------------------------------- */

    -- SUPER_ADMIN must have no role_permissions rows (bypasses via code guard)
    SELECT COUNT(rp.id) INTO v_count
    FROM role_permissions rp JOIN roles r ON r.id = rp.role_id
    WHERE r.code = 'SUPER_ADMIN';
    ASSERT v_count = 0,
        'SUPER_ADMIN must not appear in role_permissions';

    -- rt_permission_overrides must be empty after migration
    SELECT COUNT(*) INTO v_count FROM rt_permission_overrides;
    ASSERT v_count = 0,
        'rt_permission_overrides must be empty after migration; operator-only at runtime';

    -- TREASURER must have payment.approve
    ASSERT (SELECT EXISTS (
        SELECT 1 FROM role_permissions rp
        JOIN roles       r ON r.id = rp.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE r.code = 'TREASURER' AND p.code = 'payment.approve' AND rp.allow = true
    )), 'TREASURER is missing payment.approve';

    -- RESIDENT must NOT have payment.approve
    ASSERT NOT (SELECT EXISTS (
        SELECT 1 FROM role_permissions rp
        JOIN roles       r ON r.id = rp.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE r.code = 'RESIDENT' AND p.code = 'payment.approve'
    )), 'RESIDENT must not have payment.approve';

    -- RT_ADMIN must have permission.override
    ASSERT (SELECT EXISTS (
        SELECT 1 FROM role_permissions rp
        JOIN roles       r ON r.id = rp.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE r.code = 'RT_ADMIN' AND p.code = 'permission.override' AND rp.allow = true
    )), 'RT_ADMIN is missing permission.override';

    -- RT_ADMIN must have role.create
    ASSERT (SELECT EXISTS (
        SELECT 1 FROM role_permissions rp
        JOIN roles       r ON r.id = rp.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE r.code = 'RT_ADMIN' AND p.code = 'role.create' AND rp.allow = true
    )), 'RT_ADMIN is missing role.create';

    -- RT_ADMIN must have permission.update
    ASSERT (SELECT EXISTS (
        SELECT 1 FROM role_permissions rp
        JOIN roles       r ON r.id = rp.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE r.code = 'RT_ADMIN' AND p.code = 'permission.update' AND rp.allow = true
    )), 'RT_ADMIN is missing permission.update';

    -- RESIDENT must NOT have permission.override
    ASSERT NOT (SELECT EXISTS (
        SELECT 1 FROM role_permissions rp
        JOIN roles       r ON r.id = rp.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE r.code = 'RESIDENT' AND p.code = 'permission.override'
    )), 'RESIDENT must not have permission.override';

    -- All roles must be marked is_system = true
    SELECT COUNT(*) INTO v_count FROM roles WHERE is_system = false;
    ASSERT v_count = 0,
        format('%s roles are missing is_system = true', v_count);

    -- All permissions must be marked is_system = true
    SELECT COUNT(*) INTO v_count FROM permissions WHERE is_system = false;
    ASSERT v_count = 0,
        format('%s permissions are missing is_system = true', v_count);

    -- All role_permissions.allow values must be true (deny rows are not seeded)
    SELECT COUNT(*) INTO v_count FROM role_permissions WHERE allow = false;
    ASSERT v_count = 0,
        format('%s role_permissions rows have allow = false; seed must only insert grants', v_count);

    -- No orphan role_permissions (referential integrity)
    SELECT COUNT(*) INTO v_count
    FROM role_permissions rp
    WHERE NOT EXISTS (SELECT 1 FROM roles       WHERE id = rp.role_id)
       OR NOT EXISTS (SELECT 1 FROM permissions WHERE id = rp.permission_id);
    ASSERT v_count = 0,
        format('%s role_permissions rows have broken FK references', v_count);


    /* ---------------------------------------------------------------------- */
    /* 5. RLS — deprecated policies removed; new policies present             */
    /* ---------------------------------------------------------------------- */

    ASSERT NOT (SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'residents' AND policyname LIKE 'warga:%'
    )), 'Deprecated "warga:" policies still present on residents';

    ASSERT NOT (SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'expenses' AND policyname LIKE 'pengeluaran:%'
    )), 'Deprecated "pengeluaran:" policies still present on expenses';

    ASSERT NOT (SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'registration_requests'
          AND policyname = 'registration: admin read resident requests for own rt'
    )), 'Deprecated registration role-name policy still present';

    ASSERT NOT (SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'activation_invites'
          AND policyname = 'activation_invites: authorized can read'
    )), 'Deprecated activation_invites role-name policy still present';

    ASSERT (SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'residents' AND policyname = 'residents: view'
    )), 'Policy "residents: view" not found';

    ASSERT (SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'expenses' AND policyname = 'expenses: view'
    )), 'Policy "expenses: view" not found';

    ASSERT (SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'expenses' AND policyname = 'expenses: delete'
    )), 'Policy "expenses: delete" not found';

    ASSERT (SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'ledger' AND policyname = 'ledger: view'
    )), 'Policy "ledger: view" not found';

    ASSERT (SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'registration_requests'
          AND policyname = 'registration_requests: view resident'
    )), 'Policy "registration_requests: view resident" not found';

    ASSERT (SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'activation_invites'
          AND policyname = 'activation_invites: view'
    )), 'Policy "activation_invites: view" not found';


    RAISE NOTICE 'RBAC v2 validation passed — all 34 assertions succeeded.';

END $$;
