/*
 * =============================================================================
 * 022_ACTIVITY_LOGS_PERMISSION_POLICY
 *
 * Replaces the pre-RBAC v2 membership-based SELECT policy on activity_logs
 * with a permission-based check using has_permission(rt_id, 'audit.view').
 *
 * Assessment finding (Sprint 5.1):
 *   The existing policy uses get_user_rt_ids() which allows any active RT
 *   member — including RESIDENT — to read all activity logs for their RT.
 *   The 'audit.view' permission in PERMISSION_CATALOG.md is not enforced
 *   at the DB layer. Risk: RESIDENT and TREASURER can read sensitive audit
 *   entries that should be visible only to RT_ADMIN.
 *
 * Before applying:
 *   Default role grants (012_rbac_seed.sql):
 *     RT_ADMIN  — audit.view ✓
 *     RT_CHAIR  — audit.view ✗
 *     TREASURER — audit.view ✗
 *     SECRETARY — audit.view ✗
 *     RESIDENT  — audit.view ✗
 *
 *   This migration restricts activity_log reads to RT_ADMIN and SUPER_ADMIN.
 *   RT_CHAIR and TREASURER lose direct DB-layer read access. If either role
 *   should retain access, add audit.view to their role_permissions first
 *   (see Risk 3 in RLS_ASSESSMENT.md).
 *
 * Strategy:
 *   ALTER POLICY replaces the USING expression in-place.
 *   The INSERT policy (activity_logs: insert own rt) is unchanged — RT
 *   members may still insert audit entries; only read access is tightened.
 *
 *   has_permission() includes the SUPER_ADMIN bypass unconditionally.
 *   System RT (00000000-...-0001) is implicitly excluded because no regular
 *   user holds an active membership in the system RT.
 *
 * Permission used:
 *   audit.view — Active in PERMISSION_CATALOG.md
 *
 * Dependencies : 007_rls (activity_logs: read own rt), 013_rbac_functions
 * =============================================================================
 */


ALTER POLICY "activity_logs: read own rt"
    ON activity_logs
    USING (has_permission(rt_id, 'audit.view'));
