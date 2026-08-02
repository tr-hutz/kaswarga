/*
 * =============================================================================
 * 021_MEMBERSHIP_WRITE_POLICIES
 *
 * Adds RT-admin-level INSERT / UPDATE / DELETE policies to the memberships
 * table so that users with the appropriate RBAC v2 permissions can manage
 * memberships via the authenticated Supabase client — not only via
 * supabaseAdmin (service_role).
 *
 * Assessment finding (Sprint 5.1):
 *   The existing membership write policies allow only SUPER_ADMIN. RT_ADMIN
 *   and RT_CHAIR both hold membership.create / membership.update /
 *   membership.delete in the default role_permissions (012_rbac_seed.sql),
 *   but those grants had no corresponding DB-layer RLS path. All RT-level
 *   membership operations currently require supabaseAdmin bypass, which is
 *   a design gap.
 *
 * Strategy:
 *   Add three new permissive policies alongside the existing super_admin
 *   policies. PostgreSQL ORs all permissive policies for the same command,
 *   so the SUPER_ADMIN path is fully preserved.
 *
 *   New policies use has_permission() which already includes the SUPER_ADMIN
 *   bypass, so there is no double-grant risk.
 *
 * Permissions used:
 *   membership.create  — Active in PERMISSION_CATALOG.md
 *   membership.update  — Active in PERMISSION_CATALOG.md
 *   membership.delete  — Active in PERMISSION_CATALOG.md
 *
 * Default role grants (from 012_rbac_seed.sql):
 *   RT_ADMIN  — membership.create, membership.update, membership.delete ✓
 *   RT_CHAIR  — membership.create, membership.update, membership.delete ✓
 *   TREASURER — none
 *   RESIDENT  — none
 *
 * Dependencies : 007_rls (existing super_admin policies), 013_rbac_functions
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * memberships INSERT — allow RT_ADMIN / RT_CHAIR (and any role with override)
 * --------------------------------------------------------------------------- */

DROP POLICY IF EXISTS "memberships: rt admin insert" ON memberships;

CREATE POLICY "memberships: rt admin insert"
    ON memberships FOR INSERT TO authenticated
    WITH CHECK (has_permission(rt_id, 'membership.create'));


/* ----------------------------------------------------------------------------
 * memberships UPDATE — allow RT_ADMIN / RT_CHAIR (and any role with override)
 * --------------------------------------------------------------------------- */

DROP POLICY IF EXISTS "memberships: rt admin update" ON memberships;

CREATE POLICY "memberships: rt admin update"
    ON memberships FOR UPDATE TO authenticated
    USING     (has_permission(rt_id, 'membership.update'))
    WITH CHECK (has_permission(rt_id, 'membership.update'));


/* ----------------------------------------------------------------------------
 * memberships DELETE — allow RT_ADMIN / RT_CHAIR (and any role with override)
 * --------------------------------------------------------------------------- */

DROP POLICY IF EXISTS "memberships: rt admin delete" ON memberships;

CREATE POLICY "memberships: rt admin delete"
    ON memberships FOR DELETE TO authenticated
    USING (has_permission(rt_id, 'membership.delete'));
