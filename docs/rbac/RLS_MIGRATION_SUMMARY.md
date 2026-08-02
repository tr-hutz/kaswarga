# RLS_MIGRATION_SUMMARY.md

> Project: KasWarga
>
> Sprint: 5 — Task 5.2
>
> Branch: feat/rbac-v2-rls-assessment-compatibility

---

# Purpose

This document summarises the incremental RLS migrations applied in Sprint 5.2.

It is a companion to `RLS_ASSESSMENT.md` (Sprint 5.1) and documents the
outcome of each approved migration step.

---

# Migrations Implemented

## 020 — Enable RLS on RBAC v2 Tables

**File:** `supabase/migrations/020_rbac_table_rls.sql`

**Tables:** `roles`, `permissions`, `role_permissions`, `rt_permission_overrides`

**Changes:**
- Enabled RLS on all four tables (previously unprotected since 011).
- Added open SELECT policy for `authenticated` on `roles`, `permissions`,
  `role_permissions` — catalog data required by the permission management UI.
- Added full CRUD policies on `rt_permission_overrides` scoped to
  `has_permission(rt_id, 'permission.override')` — the highest-sensitivity
  RBAC table now has proper tenant isolation and permission enforcement.

**Risk:** Low. SELECT policies prevent default deny-all from breaking the UI.
No existing behavior changed — there were no prior RLS policies on these tables.

**Validation path:**
- Authenticated user with `permission.override` → can read/write own RT's overrides ✓
- Authenticated user without `permission.override` → denied ✓
- Different RT → denied ✓
- SUPER_ADMIN → full access via `has_permission()` bypass ✓

---

## 021 — Extend Membership Write Policies

**File:** `supabase/migrations/021_membership_write_policies.sql`

**Table:** `memberships`

**Changes:**
- Added three new permissive INSERT/UPDATE/DELETE policies alongside existing
  `super_admin` policies.
- RT_ADMIN and RT_CHAIR can now execute membership writes via the authenticated
  Supabase client using `membership.create`, `membership.update`,
  `membership.delete` permissions.
- SUPER_ADMIN path unchanged (still covered by existing `super_admin` policies).

**Risk:** Low. Additive change only. New policies do not replace existing ones.
PostgreSQL ORs all permissive policies for the same command.

**Validation path:**
- RT_ADMIN INSERT membership for own RT → allowed ✓
- TREASURER INSERT membership → denied (no membership.create) ✓
- RT_ADMIN INSERT membership for different RT → denied ✓
- SUPER_ADMIN INSERT → allowed via existing policy ✓

---

## 022 — Add audit.view Permission to activity_logs SELECT

**File:** `supabase/migrations/022_activity_logs_permission_policy.sql`

**Table:** `activity_logs`

**Changes:**
- `activity_logs: read own rt` SELECT policy altered.
- Old guard: `rt_id IN (get_user_rt_ids()) OR is_super_admin()`
  (any active RT member could read all audit logs)
- New guard: `has_permission(rt_id, 'audit.view')`
  (only roles with `audit.view` can read — RT_ADMIN and SUPER_ADMIN by default)
- INSERT policy (`activity_logs: insert own rt`) is unchanged.

**Risk:** Medium. Breaking change for RT_CHAIR and TREASURER who previously
had read access via RT membership alone. They do not hold `audit.view` in the
default seed (012_rbac_seed.sql). If either role needs audit access, add
`audit.view` to their `role_permissions` before applying.

**Validation path:**
- RT_ADMIN → can read own RT's logs ✓
- RT_CHAIR → denied (no audit.view in default grants) ✓
- TREASURER → denied (no audit.view) ✓
- RESIDENT → denied ✓
- SUPER_ADMIN → full access ✓
- Different RT → denied (has_permission scopes to the row's rt_id) ✓

---

## 023 — Add settings.update Permission to rt UPDATE

**File:** `supabase/migrations/023_rt_update_permission_policy.sql`

**Table:** `rt`

**Changes:**
- `rt: members can update own rt` UPDATE policy altered.
- Old guard: `id IN (get_user_rt_ids()) OR is_super_admin()`
  (any active RT member could update the RT profile)
- New guard: `has_permission(id, 'settings.update')`
  where `id` is the `rt.id` of the row being updated.

**Risk:** Low. RT_ADMIN and RT_CHAIR retain access (both hold `settings.update`
in default grants). TREASURER, SECRETARY, and RESIDENT lose DB-layer update
access — this is the intended, more restrictive behavior.

**Validation path:**
- RT_ADMIN UPDATE own RT → allowed ✓
- RT_CHAIR UPDATE own RT → allowed ✓
- TREASURER UPDATE own RT → denied ✓
- RT_ADMIN UPDATE different RT → denied ✓
- SUPER_ADMIN → full access ✓

---

## 024 — Remove Semantically Incorrect ledger INSERT Policy

**File:** `supabase/migrations/024_ledger_insert_policy.sql`

**Table:** `ledger`

**Changes:**
- `ledger: create` INSERT policy dropped.
- This policy used `has_permission(rt_id, 'ledger.view')` as the INSERT guard
  (semantically incorrect: view permission protecting writes).
- Since `insert_ledger()` is SECURITY DEFINER (bypasses RLS) and is the
  only legitimate INSERT path, no authenticated INSERT policy is needed.

**Risk:** Low. The policy was dead code on the normal write path.
Only SECURITY DEFINER functions (insert_ledger) and service_role
(supabaseAdmin) insert ledger rows. Both bypass RLS regardless.

**Validation path:**
- Direct authenticated INSERT to ledger → denied ✓
- insert_ledger() SECURITY DEFINER call → succeeds (bypasses RLS) ✓
- supabaseAdmin (service_role) INSERT → succeeds (bypasses RLS) ✓
- SELECT (ledger: view policy) unchanged → still works ✓

---

## 025 — Scope notifications INSERT Policy

**File:** `supabase/migrations/025_notifications_insert_policy.sql`

**Table:** `notifications`

**Changes:**
- `notifications: authenticated can insert` policy altered.
- Old: `WITH CHECK (true)` — any authenticated user could spam any user.
- New: `WITH CHECK (target_user_id = auth.uid() OR is_super_admin())`
- All server-side notification inserts (post Sprint 4) use supabaseAdmin
  (service_role) which bypasses RLS and is unaffected.

**Risk:** Medium. Any authenticated client-side notification insert targeting
another user will now fail. Current application state: all notification inserts
use supabaseAdmin or SECURITY DEFINER functions. Verify before applying.

**Validation path:**
- Authenticated user INSERT notification to self → allowed ✓
- Authenticated user INSERT notification to different user → denied ✓
- SUPER_ADMIN INSERT to any user → allowed ✓
- supabaseAdmin (service_role) INSERT → allowed (bypasses RLS) ✓

---

## 026 — Storage Tenant Isolation (DEFERRED)

**File:** `supabase/migrations/026_storage_tenant_isolation.sql`

**Status:** No-op placeholder. Implementation deferred.

**Reason:** Scoping storage bucket policies to RT membership requires extracting
the RT ID from the storage object path. No enforced path naming convention
(`{rt_id}/{filename}`) has been confirmed across all upload paths in the
application. Applying this without an audit risks blocking uploads and reads
for existing objects.

**Prerequisite:** Audit all storage upload paths in the application.
Confirm all three buckets use consistent `{rt_id}/...` prefix.

---

# Policies Not Changed

The following policies were assessed as **Compatible** in Sprint 5.1 and
required no changes:

| Table | Policy | Reason |
|---|---|---|
| `rt` | `rt: authenticated can read` | Open read is intentional |
| `rt` | `rt: super_admin can insert` | Platform-level, correct |
| `rt` | `rt: super_admin can delete` | Platform-level, correct |
| `users` | `users: authenticated can read` | Open read required for name lookups |
| `residents` | all 4 policies | Already RBAC v2 via migration 014 |
| `memberships` | `membership: read own` | Pure identity check |
| `memberships` | `membership: super_admin read all` | Platform-level |
| `memberships` | `membership: super_admin insert/update/delete` | Preserved alongside new policies |
| `payment_confirmations` | all 3 policies | RBAC v2 via migration 014 |
| `confirmation_details` | all 2 policies | RBAC v2 via migration 014 |
| `payments` | all 2 policies | RBAC v2 via migration 014 |
| `payment_details` | all 2 policies | RBAC v2 via migration 014 |
| `expenses` | all 4 policies | RBAC v2 via migration 014 |
| `ledger` | `ledger: view` | RBAC v2 via migration 014 |
| `notifications` | `notifications: read own` | Pure identity check |
| `notifications` | `notifications: update own` | Own-row update only |
| `registration_requests` | all 5 policies | RBAC v2 via migration 014 + 007 |
| `activation_invites` | `activation_invites: view` | RBAC v2 via migration 014 |
| storage | `*: public read` (3 policies) | Public read is intentional |

---

# Compatibility Notes

## SECURITY DEFINER functions and RLS

`has_permission()`, `is_super_admin()`, `get_user_rt_ids()`, and all approval
functions are SECURITY DEFINER. They bypass RLS on the tables they query.
This is intentional and documented in 013_rbac_functions.sql. No circular
dependency exists with the new policies in this sprint.

## service_role bypass

`supabaseAdmin` (service_role JWT) bypasses all RLS by default. Migrations
in this sprint do not affect service_role behavior.

## approve_all_pending_expenses — Informational Gap

The `approve_all_pending_expenses` function (005_functions.sql) was not
updated by migrations 018 or 019. It retains inline notification INSERTs
(which Sprint 4 moved to API routes for the single-expense path) and has no
RBAC v2 permission check. Application-layer enforcement is the sole guard.
This is tracked as a known gap for a future sprint.

## SECRETARY role unreachable

The `SECRETARY` role code exists in `roles` and has permission grants in
`role_permissions`, but the `user_role` enum in `memberships` does not include
`SECRETARY`. No user can be assigned this role. This is a known gap unrelated
to this sprint's RLS changes.

---

# Migration Application Order

Apply in sequence. Each migration is independent but must be applied after
its stated dependencies:

```
020 → 021 → 022 → 023 → 024 → 025 → (026 deferred)
```

Migration 026 is a no-op placeholder and safe to apply at any time.

---

# Risk Summary

| Migration | Risk | Notes |
|---|---|---|
| 020 | Low | Additive — enables RLS + permissive policies |
| 021 | Low | Additive — new permissive policies alongside existing |
| 022 | **Medium** | Restricts audit log reads to RT_ADMIN only |
| 023 | Low | RT_ADMIN and RT_CHAIR retain access |
| 024 | Low | Drops dead-code policy on append-only table |
| 025 | **Medium** | Verify all notification inserts use supabaseAdmin first |
| 026 | Deferred | Requires path audit |
