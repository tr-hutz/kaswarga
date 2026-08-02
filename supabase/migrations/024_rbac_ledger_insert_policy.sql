/*
 * =============================================================================
 * 024_LEDGER_INSERT_POLICY
 *
 * Removes the semantically incorrect 'ledger: create' INSERT policy that
 * uses 'ledger.view' as its authorization guard for INSERT operations.
 *
 * Assessment finding (Sprint 5.1):
 *   Migration 014 created a 'ledger: create' policy with:
 *     WITH CHECK (has_permission(rt_id, 'ledger.view'))
 *   This uses the VIEW permission to guard INSERT, which is semantically
 *   incorrect and misleading. There is no 'ledger.create' or 'ledger.write'
 *   permission in the catalog.
 *
 *   More importantly, insert_ledger() was made SECURITY DEFINER in
 *   migration 019. SECURITY DEFINER functions run as the postgres superuser
 *   and bypass ALL RLS policies. The only legitimate ledger INSERT paths are:
 *     1. insert_ledger() — SECURITY DEFINER, bypasses RLS
 *     2. supabaseAdmin (service_role) — bypasses RLS by default
 *   Neither path evaluates this policy. The policy is dead code on the
 *   normal write path.
 *
 * Rationale for DROP rather than ALTER:
 *   There is no permission code in PERMISSION_CATALOG.md that correctly
 *   describes "may directly INSERT a ledger row." The ledger is append-only
 *   via controlled functions only. Removing the authenticated INSERT policy
 *   enforces this constraint at the DB layer: no authenticated user may
 *   directly INSERT into ledger; only SECURITY DEFINER functions and
 *   service_role may do so.
 *
 *   The SELECT policy 'ledger: view' (has_permission ledger.view) is
 *   preserved unchanged.
 *
 * Dependencies : 014_rbac_rls (ledger: create), 019_fix_expense_approval_ledger
 * =============================================================================
 */


DROP POLICY IF EXISTS "ledger: create" ON ledger;
