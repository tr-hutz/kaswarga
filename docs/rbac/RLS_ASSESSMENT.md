# RLS_ASSESSMENT.md

> Project: KasWarga
>
> Sprint: 5 — Task 5.1
>
> Branch: feat/rbac-v2-rls-assessment-compatibility

---

# Purpose

This document is the RLS Assessment Report produced during Sprint 5 Task 5.1.

It inventories every existing Row-Level Security policy, compares each policy against RBAC v2,
classifies compatibility, and proposes an incremental migration plan for Sprint 5.2.

**No policy has been dropped, altered, or disabled as part of this assessment.**

---

# 1. Executive Summary

KasWarga has 14 application tables with RLS enabled plus 12 storage bucket policies.
Migration 014 (`014_rbac_rls.sql`) already replaced the original tenant-isolation policies on 9 tables
with `has_permission()` calls. The core data tables — residents, expenses, payments, ledger — are
fully RBAC v2 compatible.

Five categories of remaining work have been identified:

| Category | Count | Sprint 5.2 Priority |
|---|---|---|
| RBAC v2 tables missing RLS entirely | 4 tables | High |
| Policies still using old role-name or deprecated helper patterns | 6 policies | Medium |
| Overly permissive write policies | 2 policies | Medium |
| Storage policies lacking tenant isolation | 9 policies | Low |
| Orphaned / semantically incorrect helper usage | 3 items | Low |

---

# 2. Current RLS Policy Inventory

## 2.1 Table: `rt`

RLS enabled in: `007_rls.sql`. Not modified by `014_rbac_rls.sql`.

| Policy Name | Command | USING | WITH CHECK | Tenant Isolation | Auth Dependency |
|---|---|---|---|---|---|
| `rt: authenticated can read` | SELECT | `true` | — | None | `authenticated` role |
| `rt: super_admin can insert` | INSERT | — | `is_super_admin()` | None | `is_super_admin()` |
| `rt: members can update own rt` | UPDATE | `id IN (get_user_rt_ids()) OR is_super_admin()` | same | Own RT only | `get_user_rt_ids()` / `is_super_admin()` |
| `rt: super_admin can delete` | DELETE | `is_super_admin()` | — | None | `is_super_admin()` |

Notes: No DELETE trigger guard at RLS layer (trigger `trg_prevent_system_rt_delete` handles system RT separately).
UPDATE allows any RT member, not just those with `settings.update` permission.

---

## 2.2 Table: `users`

RLS enabled in: `007_rls.sql`. Not modified by `014_rbac_rls.sql`.

| Policy Name | Command | USING | WITH CHECK | Tenant Isolation | Auth Dependency |
|---|---|---|---|---|---|
| `users: authenticated can read` | SELECT | `true` | — | None | `authenticated` role |

Notes: Open read for all authenticated users. No INSERT/UPDATE/DELETE policies — all writes go through
service_role (supabaseAdmin), which bypasses RLS. This is intentional design.

---

## 2.3 Table: `residents`

Original policies from `007_rls.sql` were **dropped and replaced** by `014_rbac_rls.sql`.

| Policy Name | Command | USING | WITH CHECK | Tenant Isolation | Auth Dependency |
|---|---|---|---|---|---|
| `residents: view` | SELECT | `has_permission(rt_id, 'resident.view')` | — | Via `has_permission` | RBAC v2 |
| `residents: create` | INSERT | — | `has_permission(rt_id, 'resident.create')` | Via `has_permission` | RBAC v2 |
| `residents: update` | UPDATE | `has_permission(rt_id, 'resident.update')` | same | Via `has_permission` | RBAC v2 |
| `residents: delete` | DELETE | `has_permission(rt_id, 'resident.delete')` | — | Via `has_permission` | RBAC v2 |

---

## 2.4 Table: `memberships`

RLS enabled in: `007_rls.sql`. Not modified by `014_rbac_rls.sql`.

| Policy Name | Command | USING | WITH CHECK | Tenant Isolation | Auth Dependency |
|---|---|---|---|---|---|
| `membership: read own` | SELECT | `user_id = auth.uid()` | — | Own row only | `auth.uid()` |
| `membership: super_admin read all` | SELECT | `is_super_admin()` | — | None | `is_super_admin()` |
| `membership: super_admin insert` | INSERT | — | `is_super_admin()` | None | `is_super_admin()` |
| `membership: super_admin update` | UPDATE | `is_super_admin()` | — | None | `is_super_admin()` |
| `membership: super_admin delete` | DELETE | `is_super_admin()` | — | None | `is_super_admin()` |

Notes: Only SUPER_ADMIN can insert/update/delete memberships at the DB layer. RT_ADMIN with
`membership.create/update/delete` permissions has no DB-layer path to execute these operations
directly — all RT-level membership management must go through API routes using supabaseAdmin
(service_role bypass). This is a known design gap.

---

## 2.5 Table: `payment_confirmations`

Original policies from `007_rls.sql` were **dropped and replaced** by `014_rbac_rls.sql`.

| Policy Name | Command | USING | WITH CHECK | Tenant Isolation | Auth Dependency |
|---|---|---|---|---|---|
| `payment_confirmations: view` | SELECT | `has_permission(rt_id, 'payment.view')` | — | Via `has_permission` | RBAC v2 |
| `payment_confirmations: create` | INSERT | — | `has_permission(rt_id, 'payment.create')` | Via `has_permission` | RBAC v2 |
| `payment_confirmations: update` | UPDATE | `has_permission(rt_id, 'payment.view')` | same | Via `has_permission` | RBAC v2 |

Notes: The UPDATE policy uses `payment.view` for both USING and WITH CHECK rather than a
`payment.update` permission. This is intentional — status transitions (pending→approved/rejected)
are performed by SECURITY DEFINER functions which bypass RLS entirely.

---

## 2.6 Table: `confirmation_details`

Original policies from `007_rls.sql` were **dropped and replaced** by `014_rbac_rls.sql`.

| Policy Name | Command | USING | WITH CHECK | Tenant Isolation | Auth Dependency |
|---|---|---|---|---|---|
| `confirmation_details: view` | SELECT | `EXISTS (SELECT 1 FROM payment_confirmations pc WHERE pc.id = confirmation_id AND has_permission(pc.rt_id, 'payment.view'))` | — | Via parent row | RBAC v2 |
| `confirmation_details: create` | INSERT | — | `EXISTS (... has_permission(pc.rt_id, 'payment.create'))` | Via parent row | RBAC v2 |

Notes: Scoped through parent `payment_confirmations` row (no direct `rt_id` column).

---

## 2.7 Table: `payments`

Original policies from `007_rls.sql` were **dropped and replaced** by `014_rbac_rls.sql`.

| Policy Name | Command | USING | WITH CHECK | Tenant Isolation | Auth Dependency |
|---|---|---|---|---|---|
| `payments: view` | SELECT | `has_permission(rt_id, 'payment.view')` | — | Via `has_permission` | RBAC v2 |
| `payments: create` | INSERT | — | `has_permission(rt_id, 'payment.create')` | Via `has_permission` | RBAC v2 |

Notes: No UPDATE policy — approved payment rows are immutable by design. All writes go through
the `approve_confirmation` SECURITY DEFINER function.

---

## 2.8 Table: `payment_details`

Original policies from `007_rls.sql` were **dropped and replaced** by `014_rbac_rls.sql`.

| Policy Name | Command | USING | WITH CHECK | Tenant Isolation | Auth Dependency |
|---|---|---|---|---|---|
| `payment_details: view` | SELECT | `EXISTS (SELECT 1 FROM payments p WHERE p.id = payment_id AND has_permission(p.rt_id, 'payment.view'))` | — | Via parent row | RBAC v2 |
| `payment_details: create` | INSERT | — | `EXISTS (... has_permission(p.rt_id, 'payment.create'))` | Via parent row | RBAC v2 |

---

## 2.9 Table: `expenses`

Original policies from `007_rls.sql` were **dropped and replaced** by `014_rbac_rls.sql`.

| Policy Name | Command | USING | WITH CHECK | Tenant Isolation | Auth Dependency |
|---|---|---|---|---|---|
| `expenses: view` | SELECT | `has_permission(rt_id, 'expense.view')` | — | Via `has_permission` | RBAC v2 |
| `expenses: create` | INSERT | — | `has_permission(rt_id, 'expense.create')` | Via `has_permission` | RBAC v2 |
| `expenses: update` | UPDATE | `has_permission(rt_id, 'expense.update')` | same | Via `has_permission` | RBAC v2 |
| `expenses: delete` | DELETE | `has_permission(rt_id, 'expense.delete')` | — | Via `has_permission` | RBAC v2 |

Notes: `approve_expense` and `reject_expense` are SECURITY DEFINER functions (owned by postgres)
and bypass the `expenses: update` RLS policy entirely. Application-layer permission check
(`expense.approve` / `expense.reject`) is the sole enforcement path for those operations.

---

## 2.10 Table: `ledger`

Original policies from `007_rls.sql` were **dropped and replaced** by `014_rbac_rls.sql`.

| Policy Name | Command | USING | WITH CHECK | Tenant Isolation | Auth Dependency |
|---|---|---|---|---|---|
| `ledger: view` | SELECT | `has_permission(rt_id, 'ledger.view')` | — | Via `has_permission` | RBAC v2 |
| `ledger: create` | INSERT | — | `has_permission(rt_id, 'ledger.view')` | Via `has_permission` | RBAC v2 |

Notes: The INSERT policy reuses `ledger.view` instead of a dedicated `ledger.create` or
`ledger.write` permission. Since `insert_ledger` is now SECURITY DEFINER (migration 019) and
bypasses RLS entirely, this policy is not on the hot path for normal operations. However, it
remains semantically incorrect and misleading.

---

## 2.11 Table: `notifications`

RLS enabled in: `007_rls.sql`. Not modified by `014_rbac_rls.sql`.

| Policy Name | Command | USING | WITH CHECK | Tenant Isolation | Auth Dependency |
|---|---|---|---|---|---|
| `notifications: read own` | SELECT | `target_user_id = auth.uid()` | — | Own notifications | `auth.uid()` |
| `notifications: authenticated can insert` | INSERT | — | `true` | **None** | `authenticated` role |
| `notifications: update own` | UPDATE | `target_user_id = auth.uid()` | same | Own notifications | `auth.uid()` |

Notes: The INSERT policy has `WITH CHECK (true)` — any authenticated user can insert a
notification targeting any `target_user_id`. This is intentionally permissive to allow
server-side notification insertion via the `authenticated` role, but it also means a
malicious authenticated user could spam notifications targeting any user.

---

## 2.12 Table: `activity_logs`

RLS enabled in: `007_rls.sql`. Not modified by `014_rbac_rls.sql`.

| Policy Name | Command | USING | WITH CHECK | Tenant Isolation | Auth Dependency |
|---|---|---|---|---|---|
| `activity_logs: read own rt` | SELECT | `(rt_id != '00000000-...-0001' AND rt_id IN (get_user_rt_ids())) OR is_super_admin()` | — | Own RT | `get_user_rt_ids()` / `is_super_admin()` |
| `activity_logs: insert own rt` | INSERT | — | `rt_id IN (get_user_rt_ids()) OR (rt_id = '00000000-...-0001' AND is_super_admin())` | Own RT | `get_user_rt_ids()` |

Notes: Still uses the pre-RBAC v2 helper `get_user_rt_ids()`. No permission check for
read access — any active member of the RT can view all activity logs.
The `audit.view` permission in the catalog is not enforced at the DB layer.

---

## 2.13 Table: `registration_requests`

RLS enabled in: `007_rls.sql`. Partially updated by `014_rbac_rls.sql`.

| Policy Name | Source | Command | USING | WITH CHECK | Auth Dependency |
|---|---|---|---|---|---|
| `registration: super_admin read rt requests` | 007 (unchanged) | SELECT | `type = 'rt' AND is_super_admin()` | — | `is_super_admin()` |
| `registration: anyone can submit` | 007 (unchanged) | INSERT | — | `true` | `anon` + `authenticated` |
| `registration_requests: view resident` | 014 | SELECT | `type = 'resident' AND has_permission(rt_id, 'resident.view')` | — | RBAC v2 |
| `registration_requests: update` | 014 | UPDATE | `(type='rt' AND is_super_admin()) OR (type='resident' AND has_permission(rt_id, 'resident.approve'))` | — | RBAC v2 + `is_super_admin()` |
| `registration_requests: delete` | 014 | DELETE | same as update | — | RBAC v2 + `is_super_admin()` |

Notes: The three new policies from 014 are fully RBAC v2 compatible. The two unchanged 007
policies (`super_admin read rt requests` and `anyone can submit`) remain correct and
do not require modification.

---

## 2.14 Table: `activation_invites`

Original policy from `007_rls.sql` was **dropped and replaced** by `014_rbac_rls.sql`.

| Policy Name | Command | USING | WITH CHECK | Auth Dependency |
|---|---|---|---|---|
| `activation_invites: view` | SELECT | `is_super_admin() OR has_permission(rt_id, 'settings.view')` | — | RBAC v2 + `is_super_admin()` |

Notes: No INSERT/UPDATE policies — all writes go through supabaseAdmin (service_role bypass).

---

## 2.15 Storage: `storage.objects`

Three buckets: `rt-assets`, `payment-proof`, `expense-receipts`. Each has 4 policies.

| Policy Pattern | Command | USING / WITH CHECK | Auth Dependency |
|---|---|---|---|
| `<bucket>: public read` | SELECT | `bucket_id = '<bucket>'` | `public` role |
| `<bucket>: authenticated upload` | INSERT | `bucket_id = '<bucket>'` | `authenticated` role |
| `<bucket>: authenticated update` | UPDATE | `bucket_id = '<bucket>'` | `authenticated` role |
| `<bucket>: authenticated delete` | DELETE | `bucket_id = '<bucket>'` | `authenticated` role |

Notes: No tenant isolation. Any authenticated user from any RT can upload, update, or delete
objects in any RT's storage buckets. This was acceptable before multi-tenant support became
a priority but is the largest gap for cross-RT data protection.

---

## 2.16 RBAC v2 Tables: `roles`, `permissions`, `role_permissions`, `rt_permission_overrides`

**RLS is NOT enabled on any of these tables.**

These tables were created in `011_rbac_tables.sql` without `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.

| Table | RLS | Effect |
|---|---|---|
| `roles` | Disabled | Readable by any authenticated user; PostgreSQL table grants permitting |
| `permissions` | Disabled | Readable by any authenticated user |
| `role_permissions` | Disabled | Readable; writes via application routes only |
| `rt_permission_overrides` | Disabled | **Most sensitive**: contains per-RT permission customizations |

The application layer enforces `permission.update` and `permission.override` permission checks
before any writes. There is no DB-layer write protection for these tables.

---

# 3. Helper Function Inventory

## 3.1 Pre-RBAC v2 Helpers (005_functions.sql)

| Function | Signature | Type | SECURITY DEFINER | Purpose | Active in Policies |
|---|---|---|---|---|---|
| `is_super_admin` | `() → boolean` | SQL | Yes | Checks `role = 'SUPER_ADMIN'` in memberships | `rt`, `memberships`, `registration_requests`, `activation_invites`, `activity_logs` |
| `get_user_rt_ids` | `() → setof uuid` | SQL | Yes | Returns active RT IDs for `auth.uid()` | `rt: update`, `activity_logs` |
| `is_member_of_rt` | `(p_rt_id uuid) → boolean` | SQL | Yes | Checks active membership in specific RT | **None** (orphaned after 014) |
| `get_last_balance` | `(p_rt_id uuid) → bigint` | PL/pgSQL | No | Computes ledger running balance | Not an RLS helper; called by `insert_ledger` |
| `insert_ledger` | `(uuid, varchar, ...) → uuid` | PL/pgSQL | **Yes** (as of 019) | Appends ledger entry with balance | Not an RLS policy; called by approval functions |
| `generate_rt_code` | `() → text` | PL/pgSQL | Yes | Utility: generates next RT code | Not an RLS helper |
| `cleanup_expired_registrations` | `() → void` | PL/pgSQL | Yes | Maintenance: marks expired requests | Not an RLS helper |
| `approve_confirmation` | `(uuid, uuid) → void` | PL/pgSQL | Yes | Payment approval (RBAC v2 check via `user_has_permission` as of 017) | Not a policy |
| `reject_confirmation` | `(uuid, text, uuid) → void` | PL/pgSQL | Yes | Payment rejection (RBAC v2 check as of 017) | Not a policy |
| `approve_expense` | `(uuid, uuid) → void` | PL/pgSQL | Yes | Expense approval (no DB-level permission check — app layer only) | Not a policy |
| `reject_expense` | `(uuid, text, uuid) → void` | PL/pgSQL | Yes | Expense rejection (no DB-level permission check — app layer only) | Not a policy |
| `approve_all_pending_expenses` | `(uuid, uuid) → int` | PL/pgSQL | Yes | Bulk expense approval. No RBAC v2 permission check; still has notification INSERT (not updated by 018/019) | Not a policy |

## 3.2 RBAC v2 Helpers (013_rbac_functions.sql, 017_rbac_fix_payment_approval.sql)

| Function | Signature | Type | SECURITY DEFINER | Purpose | Active in Policies |
|---|---|---|---|---|---|
| `has_permission` | `(p_rt_id uuid, p_permission_code text) → boolean` | SQL | Yes | Core RBAC v2 check using `auth.uid()` | `residents`, `payment_confirmations`, `confirmation_details`, `payments`, `payment_details`, `expenses`, `ledger`, `registration_requests`, `activation_invites` |
| `current_membership` | `() → setof memberships` | SQL | Yes | Returns all active memberships for `auth.uid()` | Not in policies directly; used by PermissionService |
| `current_neighborhood` | `() → setof uuid` | SQL | Yes | Returns active RT IDs for `auth.uid()` | Not in policies directly; functionally identical to `get_user_rt_ids()` |
| `user_has_permission` | `(p_user_id uuid, p_rt_id uuid, p_permission_code text) → boolean` | SQL | Yes | Explicit-user-id variant of `has_permission`; safe for SD functions where `auth.uid()` is NULL | `approve_confirmation`, `reject_confirmation` (inside SD functions) |

---

# 4. RBAC v2 Compatibility Matrix

## Classification Key

| Class | Meaning |
|---|---|
| **Compatible** | Works as-is with RBAC v2. No change needed. |
| **Needs Extension** | Current logic is correct but incomplete; a permission check should be added. |
| **Needs Refactoring** | Current logic conflicts with RBAC v2 principles or is semantically incorrect. |
| **Deprecated** | Superseded by RBAC v2; can be replaced in a future sprint. |

---

## Table: `rt`

| Policy | Classification | Justification |
|---|---|---|
| `rt: authenticated can read` | **Compatible** | Open read is intentional; RT names/profiles are non-sensitive tenant identity data. |
| `rt: super_admin can insert` | **Compatible** | RT creation is a platform-level operation. `is_super_admin()` is the correct guard. |
| `rt: members can update own rt` | **Needs Extension** | Any RT member can update the RT profile. Should require `settings.update` permission. Currently only tenant-scoped, not permission-scoped. |
| `rt: super_admin can delete` | **Compatible** | RT deletion is platform-level. `is_super_admin()` is correct. |

---

## Table: `users`

| Policy | Classification | Justification |
|---|---|---|
| `users: authenticated can read` | **Compatible** | Open read required for name lookups across the application. No sensitive PII beyond name/email. |

---

## Table: `residents`

| Policy | Classification | Justification |
|---|---|---|
| `residents: view` | **Compatible** | Uses `has_permission(rt_id, 'resident.view')`. RBAC v2. |
| `residents: create` | **Compatible** | Uses `has_permission(rt_id, 'resident.create')`. RBAC v2. |
| `residents: update` | **Compatible** | Uses `has_permission(rt_id, 'resident.update')`. RBAC v2. |
| `residents: delete` | **Compatible** | Uses `has_permission(rt_id, 'resident.delete')`. RBAC v2. |

---

## Table: `memberships`

| Policy | Classification | Justification |
|---|---|---|
| `membership: read own` | **Compatible** | Pure identity check. Every user must be able to read their own membership to function. |
| `membership: super_admin read all` | **Compatible** | Platform-level read for user management. |
| `membership: super_admin insert` | **Needs Extension** | RT_ADMIN has `membership.create` permission but no DB-layer INSERT path. All RT membership writes currently require supabaseAdmin bypass. Add a policy for `has_permission(rt_id, 'membership.create')`. |
| `membership: super_admin update` | **Needs Extension** | RT_ADMIN has `membership.update` but no DB-layer UPDATE path. Add policy for `has_permission(rt_id, 'membership.update')`. |
| `membership: super_admin delete` | **Needs Extension** | RT_ADMIN has `membership.delete` but no DB-layer DELETE path. Add policy for `has_permission(rt_id, 'membership.delete')`. |

---

## Table: `payment_confirmations`

| Policy | Classification | Justification |
|---|---|---|
| `payment_confirmations: view` | **Compatible** | `has_permission(rt_id, 'payment.view')`. RBAC v2. |
| `payment_confirmations: create` | **Compatible** | `has_permission(rt_id, 'payment.create')`. RBAC v2. |
| `payment_confirmations: update` | **Compatible** | Uses `payment.view` for UPDATE — intentional because `approve_confirmation`/`reject_confirmation` are SECURITY DEFINER. The policy prevents unauthorized direct row edits. |

---

## Tables: `confirmation_details`, `payments`, `payment_details`

| Policy | Classification | Justification |
|---|---|---|
| All 6 policies | **Compatible** | All use `has_permission()` with correct permission codes. RBAC v2. |

---

## Table: `expenses`

| Policy | Classification | Justification |
|---|---|---|
| `expenses: view` | **Compatible** | RBAC v2. |
| `expenses: create` | **Compatible** | RBAC v2. |
| `expenses: update` | **Compatible** | RBAC v2. RT_CHAIR has `expense.approve` but NOT `expense.update` — the approval path correctly routes through the SECURITY DEFINER function which bypasses this policy. |
| `expenses: delete` | **Compatible** | RBAC v2. |

---

## Table: `ledger`

| Policy | Classification | Justification |
|---|---|---|
| `ledger: view` | **Compatible** | `has_permission(rt_id, 'ledger.view')`. RBAC v2. |
| `ledger: create` | **Needs Refactoring** | Uses `ledger.view` permission for INSERT. No `ledger.create` permission exists in the catalog. Since `insert_ledger` is SECURITY DEFINER (019), the INSERT policy is bypassed on the normal path, but the policy is semantically incorrect. The correct fix is to restrict direct INSERT to service_role or add a `ledger.write` permission. |

---

## Table: `notifications`

| Policy | Classification | Justification |
|---|---|---|
| `notifications: read own` | **Compatible** | Pure identity check `auth.uid()`. Correct. |
| `notifications: authenticated can insert` | **Needs Refactoring** | `WITH CHECK (true)` allows any authenticated user to insert notifications targeting any user in any RT. This enables notification spam. The intent is to allow server-side insertions; those now go through supabaseAdmin (service_role) which bypasses RLS. The policy is no longer required for the current insertion path and should be scoped. |
| `notifications: update own` | **Compatible** | Users can only mark their own notifications as read. Correct. |

---

## Table: `activity_logs`

| Policy | Classification | Justification |
|---|---|---|
| `activity_logs: read own rt` | **Needs Extension** | Uses `get_user_rt_ids()` (pre-RBAC v2 helper). Functionally correct for tenant isolation but does not enforce `audit.view` permission. Any active RT member can read all audit logs. |
| `activity_logs: insert own rt` | **Needs Extension** | Same: uses `get_user_rt_ids()` without permission check. Writes should require an explicit audit permission or be service_role-only. |

---

## Table: `registration_requests`

| Policy | Classification | Justification |
|---|---|---|
| `registration: super_admin read rt requests` | **Compatible** | Platform-level. Correct. |
| `registration: anyone can submit` | **Compatible** | Public registration is a product requirement. `anon` access is intentional. |
| `registration_requests: view resident` | **Compatible** | RBAC v2. |
| `registration_requests: update` | **Compatible** | RBAC v2 with SUPER_ADMIN bypass. |
| `registration_requests: delete` | **Compatible** | RBAC v2 with SUPER_ADMIN bypass. |

---

## Table: `activation_invites`

| Policy | Classification | Justification |
|---|---|---|
| `activation_invites: view` | **Compatible** | `is_super_admin() OR has_permission(rt_id, 'settings.view')`. RBAC v2. |

---

## Storage Buckets

| Policy Pattern | Classification | Justification |
|---|---|---|
| `<bucket>: public read` | **Compatible** | Public read of assets/proofs is intentional. |
| `<bucket>: authenticated upload` | **Needs Extension** | Any authenticated user from any RT can upload. Should be scoped to `is_member_of_rt()` or an RT-specific permission check. Risk: cross-RT storage pollution. |
| `<bucket>: authenticated update` | **Needs Extension** | Same as upload. |
| `<bucket>: authenticated delete` | **Needs Extension** | Same; additionally any user could delete other RT's files. |

---

## RBAC v2 Tables (no RLS)

| Table | Classification | Justification |
|---|---|---|
| `roles` | **Needs Extension** | No RLS. Read-only data; low sensitivity. Enable RLS with an open SELECT policy for authenticated users. |
| `permissions` | **Needs Extension** | No RLS. Read-only data; low sensitivity. Same as `roles`. |
| `role_permissions` | **Needs Extension** | No RLS. Contains global permission assignments. Should be readable by authenticated users; writes restricted by permission check. |
| `rt_permission_overrides` | **Needs Extension** | No RLS. Contains per-RT permission configuration — **highest sensitivity**. An authenticated user who bypasses the application layer could grant themselves permissions. Must add tenant-scoped RLS. |

---

# 5. Helper Function Assessment

| Function | Recommendation | Reason |
|---|---|---|
| `is_super_admin()` | **Reuse** | Correct, stable, used in 5+ policies. Do not duplicate. |
| `get_user_rt_ids()` | **Reuse (short-term) / Replace (long-term)** | Functionally identical to `current_neighborhood()`. Replacing it in policies improves consistency but is not urgent. Never duplicate. |
| `is_member_of_rt(uuid)` | **Deprecated** | No active policy uses it after 014. Could replace storage policies' authentication check if storage policies are tightened. |
| `has_permission(uuid, text)` | **Reuse** | Primary RBAC v2 evaluation function. Use for all new RLS policies where `auth.uid()` is available. |
| `current_neighborhood()` | **Reuse** | Preferred successor to `get_user_rt_ids()`. Identical logic. Use in new policies. |
| `current_membership()` | **Reuse** | Used by PermissionService. Not needed in RLS policies directly. |
| `user_has_permission(uuid, uuid, text)` | **Reuse** | Required in SECURITY DEFINER functions where `auth.uid()` is NULL. Do not re-create. |
| `insert_ledger(...)` | **Reuse** | SECURITY DEFINER as of 019. Correct pattern. |

**New helper functions needed in Sprint 5.2:** None. All required helpers already exist.
The key insight is that `user_has_permission` (017) provides the explicit-user-id path already.

---

# 6. Migration Plan for Sprint 5.2

The plan is ordered by risk and dependency. Each step is an independent, minimal migration.
No policy is dropped without a replacement being created first.

## Step 1 — Enable RLS on RBAC tables (High Priority)

**Target:** `roles`, `permissions`, `role_permissions`, `rt_permission_overrides`

**Action:** `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + open SELECT policy for authenticated.
Add `rt_permission_overrides` tenant isolation: SELECT scoped to `has_permission(rt_id, 'permission.override')`.

**Risk:** Low. Enabling RLS on a table with no policies defaults to deny-all.
Must add permissive SELECT policies immediately in the same migration.

**Migration name:** `019_rbac_table_rls.sql`

---

## Step 2 — Extend membership write policies (Medium Priority)

**Target:** `memberships`

**Action:** Add three new policies alongside existing SUPER_ADMIN policies:
```
memberships INSERT: has_permission(rt_id, 'membership.create')
memberships UPDATE: has_permission(rt_id, 'membership.update')
memberships DELETE: has_permission(rt_id, 'membership.delete')
```
The existing `super_admin insert/update/delete` policies remain unchanged (additive change).

**Risk:** Low. New permissive policies alongside existing ones. `is_super_admin()` bypass preserved.

**Migration name:** `020_rbac_membership_write_policies.sql`

---

## Step 3 — Extend activity_logs with audit.view permission (Medium Priority)

**Target:** `activity_logs`

**Action:** Replace `get_user_rt_ids()` with `has_permission()` in the SELECT policy.
Keep INSERT policy as-is (member-scoped INSERT is acceptable for now).

Old:
```sql
using ((rt_id != '00000000-...' and rt_id in (select get_user_rt_ids())) or is_super_admin())
```
New:
```sql
using (has_permission(rt_id, 'audit.view') or is_super_admin())
```

**Risk:** Medium. Restricts read access: RESIDENT and SECRETARY do not have `audit.view`
in the default role_permissions. Verify the permission matrix grants `audit.view` to RT_ADMIN
before applying. Currently only RT_ADMIN holds this permission — this is the intended behavior.

**Migration name:** `022_rbac_activity_logs_permission_policy.sql`

---

## Step 4 — Extend rt update policy with settings.update (Low Priority)

**Target:** `rt`

**Action:** Replace membership-scoped UPDATE with permission check:

Old:
```sql
using (id in (select get_user_rt_ids()) or is_super_admin())
```
New:
```sql
using (has_permission(id, 'settings.update') or is_super_admin())
```

**Risk:** Low. Restricts RT profile updates to members holding `settings.update`.
RT_ADMIN and RT_CHAIR both hold `settings.update` by default. Behavior is unchanged for
default role assignments.

**Migration name:** `023_rbac_rt_update_permission_policy.sql`

---

## Step 5 — Refactor ledger insert policy (Low Priority)

**Target:** `ledger`

**Action:** Replace the semantically incorrect `ledger.view`-as-insert guard.
Since `insert_ledger` is SECURITY DEFINER and is the only legitimate INSERT path,
the policy should restrict direct INSERT to service_role or an internal-only guard:

Option A (recommended): Restrict to service_role only (drop the authenticated INSERT).
Option B: Keep a minimal `has_permission(rt_id, 'ledger.view')` check (current behavior is
  functionally equivalent for SECURITY DEFINER callers, just misleadingly named).

**Risk:** Low. `insert_ledger` bypasses this policy anyway. Opt A is cleaner.

**Migration name:** `024_rbac_ledger_insert_policy.sql`

---

## Step 6 — Refactor notifications insert policy (Low Priority)

**Target:** `notifications`

**Action:** Replace `WITH CHECK (true)` with a scoped check.
Since all current notification inserts go through supabaseAdmin (service_role), the
authenticated INSERT policy is no longer required. Replace with:
```sql
WITH CHECK (target_user_id = auth.uid() OR is_super_admin())
```
This allows users to insert notifications to themselves (for future self-service use)
while preventing cross-user spam.

**Risk:** Medium. Any application path that currently inserts notifications via the authenticated
client (not supabaseAdmin) will break. Audit `lib/repositories/notification.repository.ts`
and all API routes before applying. Current post-Sprint-4 state: all notification inserts
use supabaseAdmin. Verify no regression path exists before applying.

**Migration name:** `025_rbac_notifications_insert_policy.sql`

---

## Step 7 — Scope storage policies to RT membership (Low Priority)

**Target:** `storage.objects` (all three buckets)

**Action:** Add `is_member_of_rt(folder_rt_id)` checks to INSERT/UPDATE/DELETE policies.
Storage paths should follow the convention `{rt_id}/{filename}`. The policy would extract
the RT ID from the object path.

**Risk:** High. Requires a storage path naming convention to be enforced. If existing
stored objects do not follow a consistent `{rt_id}/` prefix, the policy cannot correctly
scope by RT. Requires a separate storage path audit before implementation.

**Migration name:** `022_rbac_storage_tenant_isolation.sql` (requires path audit first)

---

## Steps Not Required

The following were evaluated and require no changes:

- `registration_requests` policies — already RBAC v2 compatible
- `activation_invites` policy — already RBAC v2 compatible
- `residents`, `payments`, `expenses`, `payment_confirmations`, `confirmation_details`,
  `payment_details` policies — all use `has_permission()`, fully compatible
- `users: authenticated can read` — open read is intentional
- `rt: authenticated can read` — open read is intentional
- `membership: read own` — pure identity check, no change needed

---

# 7. Risk Analysis

## Risk 1 — RBAC tables unprotected at DB layer (High)

**Description:** `rt_permission_overrides` has no RLS. An authenticated user who bypasses
the application layer (e.g., using Supabase client libraries directly with their JWT) can
read all RT permission customizations and, if table grants allow writes, could grant themselves
any permission.

**Mitigation:** Apply Step 1 (migration 020) before any other step.
Add tenant-scoped RLS that requires `permission.override` to read/write overrides for a
given RT.

**Probability:** Medium. Requires knowledge of the table schema and a valid JWT.

---

## Risk 2 — Membership writes are application-only (Medium)

**Description:** RT_ADMIN holds `membership.create/update/delete` permissions, but the DB-layer
RLS only allows SUPER_ADMIN to write to `memberships`. All RT-level membership operations
currently bypass RLS via supabaseAdmin. If the API routes were to fail silently, a SUPER_ADMIN
bypass would be required.

**Mitigation:** Apply Step 2 (migration 021). This adds DB-layer enforcement that mirrors
the application-layer permission checks already in place.

---

## Risk 3 — activity_logs policy change restricts non-admin read (Medium)

**Description:** Changing `activity_logs: read own rt` from `get_user_rt_ids()` to
`has_permission(rt_id, 'audit.view')` will restrict log reading to RT_ADMIN only
(the only role with `audit.view` in default assignments). TREASURER and RT_CHAIR will
lose log access.

**Mitigation:** Before applying Step 3 (migration 022), verify whether TREASURER or RT_CHAIR
should retain audit log access. If yes, add `audit.view` to their role_permissions first
(a data migration), then apply the RLS change.

---

## Risk 4 — notifications insert restriction may break future features (Low)

**Description:** Any future feature that inserts notifications client-side (via the authenticated
Supabase client, not supabaseAdmin) will fail if Step 6 (migration 025) is applied.

**Mitigation:** Apply Step 6 only after confirming all current and planned notification flows
use supabaseAdmin. Document the constraint in the codebase.

---

## Risk 5 — Storage tenant isolation requires path convention audit (High for Step 7)

**Description:** Scoping storage policies to RT membership requires extracting the RT ID
from the object path. If existing uploaded files do not follow a `{rt_id}/...` naming
convention, the policy cannot be applied correctly.

**Mitigation:** Defer Step 7 (migration 026) until a storage path audit is completed.
This is a separate investigation from this sprint.

---

## Risk 6 — SECRETARY role unreachable via memberships (Informational)

**Description:** `SECRETARY` exists in the `roles` table (seeded in 012) and in `lib/auth/types.ts`,
but the `user_role` enum in `memberships` does not include `SECRETARY`. No user can be assigned
the SECRETARY role in the database. The 10 SECRETARY permission grants in `role_permissions` are
unreachable via the current `has_permission()` function.

**Mitigation:** This is likely intentional (SECRETARY feature not yet implemented). A future
migration will need to `ALTER TYPE user_role ADD VALUE 'SECRETARY'` before the role becomes usable.
No action required in Sprint 5.2.

---

## Risk 7 — approve_all_pending_expenses lacks RBAC v2 check and stale notification pattern (Medium)

**Description:** `approve_all_pending_expenses` (005_functions.sql) was not updated by
migrations 017, 018, or 019. It has no RBAC v2 permission check (only application-layer
enforcement), and it still contains inline notification INSERTs that were moved to API
routes in migration 018 for the single-expense path. If called, notifications from this
function will not reliably trigger Supabase Realtime on some plan tiers.

**Mitigation:** Add `user_has_permission` check inside the function; move its notification
inserts to the calling API route or handle separately. This should be tracked as a Sprint 5.2
item alongside expense-related policy changes.

---

# 8. Summary Table

| Sprint 5.2 Migration | Target | Action | Priority | Risk |
|---|---|---|---|---|
| 020 | roles, permissions, role_permissions, rt_permission_overrides | Enable RLS + open SELECT | High | Low |
| 021 | memberships | Add RT-admin write policies | Medium | Low |
| 022 | activity_logs | Add `audit.view` permission check to SELECT | Medium | Medium |
| 023 | rt | Add `settings.update` permission check to UPDATE | Low | Low |
| 024 | ledger | Fix INSERT policy — remove `ledger.view` misuse | Low | Low |
| 025 | notifications | Scope INSERT policy — remove `true` wildcard | Low | Medium |
| 026 | storage.objects | Add tenant isolation to upload/update/delete | Low | High |

Total: 7 incremental migrations. No existing policy is dropped without a replacement.
No schema changes. No application code changes.
