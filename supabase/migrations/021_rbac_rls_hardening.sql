/*
 * =============================================================================
 * 021_RBAC_RLS_HARDENING
 *
 * Consolidation of four single-statement Sprint 5.1 RLS assessment fixes:
 *
 *  1. activity_logs SELECT — restrict to has_permission('audit.view')
 *     instead of the membership-scoped get_user_rt_ids() check.
 *
 *  2. rt UPDATE — restrict to has_permission('settings.update')
 *     instead of allowing any active RT member.
 *
 *  3. ledger INSERT — drop dead-code policy; all ledger writes go through
 *     insert_ledger() (SECURITY DEFINER) or service_role, both bypass RLS.
 *
 *  4. notifications INSERT — drop wildcard authenticated INSERT policy;
 *     all notification writes now use supabaseAdmin / SECURITY DEFINER.
 *     007_rls.sql was updated to not create this policy on fresh installs.
 *
 * Dependencies:
 *   007_rls (original policies), 013_rbac_functions (has_permission),
 *   018_fix_expense_approval_ledger (SECURITY DEFINER on insert_ledger)
 * =============================================================================
 */


-- 1. Activity logs: restrict SELECT to users with audit.view permission
ALTER POLICY "activity_logs: read own rt"
    ON activity_logs
    USING (has_permission(rt_id, 'audit.view'));


-- 2. RT profile: restrict UPDATE to users with settings.update permission
ALTER POLICY "rt: members can update own rt"
    ON rt
    USING     (has_permission(id, 'settings.update'))
    WITH CHECK (has_permission(id, 'settings.update'));


-- 3. Ledger: drop dead INSERT policy (insert_ledger is SECURITY DEFINER)
DROP POLICY IF EXISTS "ledger: create" ON ledger;


-- 4. Notifications: drop wildcard INSERT (all writes now use service_role)
DROP POLICY IF EXISTS "notifications: authenticated can insert" ON notifications;
