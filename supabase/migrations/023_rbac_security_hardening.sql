/*
 * =============================================================================
 * 023_RBAC_SECURITY_HARDENING
 *
 * Sprint 5.3 — Minimal security hardening identified during RLS validation.
 *
 * Three issues addressed:
 *
 *   Issue 1 (HIGH) — approve_all_pending_expenses callable by any authenticated
 *     user with no RBAC v2 permission check. Function is SECURITY DEFINER so any
 *     authenticated user who knows the signature can approve all expenses for any
 *     RT directly via the Supabase client library, bypassing the application layer
 *     entirely. Fix: restrict EXECUTE to service_role (callers must go through the
 *     API route which uses supabaseAdmin). Pattern matches insert_ledger (019).
 *
 *   Issue 2 (MEDIUM) — is_super_admin(), get_user_rt_ids(), is_member_of_rt()
 *     created in 005_functions.sql without REVOKE ALL FROM PUBLIC. PostgreSQL
 *     grants EXECUTE to PUBLIC by default when no explicit REVOKE precedes the
 *     function creation. All three are SECURITY DEFINER and access memberships
 *     data. While they only return data for auth.uid() (safe in practice), exposing
 *     SECURITY DEFINER functions to PUBLIC violates the principle of least privilege.
 *     Fix: REVOKE ALL FROM PUBLIC; GRANT EXECUTE to authenticated only.
 *
 *   Issue 3 (LOW) — approve_confirmation() and reject_confirmation() (017)
 *     are granted to authenticated but NOT to service_role. They are invoked via
 *     supabaseAdmin.rpc() (service_role JWT). The calls succeed because Supabase's
 *     service_role PostgreSQL role currently has broad default privileges, but the
 *     explicit grant is absent — a future Supabase privilege hardening could break
 *     these calls. Fix: add service_role grant for consistency with approve_expense
 *     / reject_expense (019).
 *
 * Dependencies : 005_functions, 013_rbac_functions, 016_fix_payment_approval_rbac
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * Issue 1 — approve_all_pending_expenses
 *
 * Restrict from 'authenticated' to 'service_role' only.
 * All callers in the application go through supabaseAdmin (service_role).
 * An authenticated user calling this directly would bypass all permission checks.
 * --------------------------------------------------------------------------- */

REVOKE ALL     ON FUNCTION approve_all_pending_expenses(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION approve_all_pending_expenses(uuid, uuid) FROM authenticated;
GRANT  EXECUTE ON FUNCTION approve_all_pending_expenses(uuid, uuid) TO service_role;


/* ----------------------------------------------------------------------------
 * Issue 2 — SECURITY DEFINER helpers missing REVOKE FROM PUBLIC
 *
 * 005_functions.sql created these without REVOKE ALL FROM PUBLIC, so PostgreSQL's
 * default PUBLIC EXECUTE is still in effect. Revoke it and re-grant to the minimum
 * required role.
 *
 * Note: is_super_admin() has no explicit GRANT in 005 at all — the RLS engine
 * calls it via the policy evaluation path (which runs as the row-owner role).
 * Adding an explicit authenticated grant keeps it callable from application queries.
 * --------------------------------------------------------------------------- */

REVOKE ALL     ON FUNCTION is_super_admin()          FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION is_super_admin()          TO authenticated;

REVOKE ALL     ON FUNCTION get_user_rt_ids()         FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION get_user_rt_ids()         TO authenticated;

REVOKE ALL     ON FUNCTION is_member_of_rt(uuid)     FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION is_member_of_rt(uuid)     TO authenticated;


/* ----------------------------------------------------------------------------
 * Issue 3 — approve_confirmation / reject_confirmation missing service_role grant
 *
 * These functions are invoked via supabaseAdmin.rpc() in API routes.
 * Making the service_role grant explicit prevents a future Supabase privilege
 * hardening from silently breaking payment approval/rejection.
 * --------------------------------------------------------------------------- */

GRANT EXECUTE ON FUNCTION approve_confirmation(uuid, uuid)      TO service_role;
GRANT EXECUTE ON FUNCTION reject_confirmation(uuid, text, uuid) TO service_role;
