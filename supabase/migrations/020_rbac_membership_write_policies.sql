/*
 * =============================================================================
 * 020_MEMBERSHIP_POLICIES
 *
 * Adds SELECT / INSERT / UPDATE / DELETE policies to the memberships table
 * so that users with the appropriate RBAC v2 permissions can manage and read
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
 *   The existing SELECT policy ("membership: read own") in 007_rls.sql scopes
 *   to user_id = auth.uid() only. This means querying residents with a
 *   memberships(...) join returns empty arrays for all other residents, making
 *   role badges and the role-change UI invisible to RT Admins.
 *
 * Strategy:
 *   Add permissive policies alongside the existing super_admin policies.
 *   PostgreSQL ORs all permissive policies for the same command, so the
 *   SUPER_ADMIN path is fully preserved.
 *
 *   All policies use has_permission() which already includes the SUPER_ADMIN
 *   bypass, so there is no double-grant risk.
 *
 * Permissions used:
 *   membership.view    — RT_ADMIN, RT_CHAIR, SECRETARY
 *   membership.create  — RT_ADMIN, RT_CHAIR
 *   membership.update  — RT_ADMIN, RT_CHAIR
 *   membership.delete  — RT_ADMIN, RT_CHAIR
 *
 * Dependencies : 007_rls (existing super_admin policies), 013_rbac_functions
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * memberships SELECT — any active RT member may read all memberships in their RT
 *
 * Knowing who holds which role within an RT is not sensitive; every member
 * should be able to see role badges for their neighbours.
 *
 * is_member_of_rt() is SECURITY DEFINER so there is no recursive RLS issue.
 * rt_id IS NOT NULL excludes the SUPER_ADMIN membership row (rt_id = NULL),
 * which falls through to the existing "membership: super_admin read all".
 * --------------------------------------------------------------------------- */

DROP POLICY IF EXISTS "memberships: view" ON memberships;

CREATE POLICY "memberships: view"
    ON memberships FOR SELECT TO authenticated
    USING (
        rt_id IS NOT NULL
        AND is_member_of_rt(rt_id)
    );


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
