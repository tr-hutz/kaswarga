/*
 * =============================================================================
 * 023_RT_UPDATE_PERMISSION_POLICY
 *
 * Replaces the membership-scoped UPDATE policy on the rt table with a
 * permission-based check using has_permission(id, 'settings.update').
 *
 * Assessment finding (Sprint 5.1):
 *   The existing policy 'rt: members can update own rt' uses
 *   get_user_rt_ids() which allows ANY active RT member — including
 *   RESIDENT — to update the RT profile (name, monthly fee, address, etc.).
 *   Only users with the 'settings.update' permission should be able to
 *   modify RT-level configuration.
 *
 * Default role grants (012_rbac_seed.sql):
 *   RT_ADMIN  — settings.update ✓
 *   RT_CHAIR  — settings.update ✓
 *   TREASURER — settings.update ✗
 *   SECRETARY — settings.update ✗
 *   RESIDENT  — settings.update ✗
 *
 * Behavior change:
 *   RT_ADMIN and RT_CHAIR retain update access (unchanged for default grants).
 *   TREASURER, SECRETARY, and RESIDENT lose DB-layer update access.
 *   SUPER_ADMIN retains access via has_permission() bypass.
 *
 * Note on column reference:
 *   The policy is on the rt table. The rt.id column is the RT being updated.
 *   has_permission(id, 'settings.update') evaluates whether auth.uid() holds
 *   settings.update within the RT identified by rt.id (the row being updated).
 *
 * Dependencies : 007_rls (rt: members can update own rt), 013_rbac_functions
 * =============================================================================
 */


ALTER POLICY "rt: members can update own rt"
    ON rt
    USING     (has_permission(id, 'settings.update'))
    WITH CHECK (has_permission(id, 'settings.update'));
