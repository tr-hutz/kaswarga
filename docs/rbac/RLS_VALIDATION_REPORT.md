# RLS_VALIDATION_REPORT.md

> Project: KasWarga
>
> Sprint: 5 — Task 5.3
>
> Branch: feat/rbac-v2-rls-assessment-compatibility

---

# Purpose

This document is the RLS Validation Report produced during Sprint 5 Task 5.3.

It validates every authorization path implemented in Sprints 5.1 and 5.2,
documents cross-tenant isolation, reviews security hardening, and records
performance observations.

**No policies were redesigned or rewritten in this sprint.**
**Security hardening was applied minimally and only where clearly justified.**

---

# 1. Executive Summary

The post-Sprint-5.2 RLS implementation is sound. All critical authorization paths
were validated by static analysis against the full migration history (000–026).

Three security hardening issues were identified and addressed in migration 027:

| Severity | Issue | Migration |
|---|---|---|
| HIGH | `approve_all_pending_expenses` callable by any authenticated user — no permission check | 027 |
| MEDIUM | Missing `REVOKE FROM PUBLIC` on three SECURITY DEFINER helper functions | 027 |
| LOW | `approve_confirmation` / `reject_confirmation` missing `service_role` grant | 027 |

One deferred risk remains: storage bucket tenant isolation (migration 026 placeholder).
This requires a separate path audit before it can be implemented.

Performance: `has_permission()` is called per-row on all 9 core tables. A composite
index on `memberships(user_id, rt_id, status)` is recommended for production workloads.
The existing `idx_memberships_user_id` is adequate for small to medium RT sizes.

---

# 2. Validation Scope

## 2.1 Tables Validated

All tables with RLS enabled post-Sprint-5.2:

| Table | RLS Source |
|---|---|
| `rt` | 007, 023 |
| `users` | 007 |
| `residents` | 014 |
| `memberships` | 007, 021 |
| `payment_confirmations` | 014 |
| `confirmation_details` | 014 |
| `payments` | 014 |
| `payment_details` | 014 |
| `expenses` | 014 |
| `ledger` | 014, 024 |
| `notifications` | 007, 025 |
| `activity_logs` | 007, 022 |
| `registration_requests` | 007, 014 |
| `activation_invites` | 014 |
| `roles` | 020 |
| `permissions` | 020 |
| `role_permissions` | 020 |
| `rt_permission_overrides` | 020 |
| `storage.objects` | 007 (partial) |

## 2.2 Scenarios Covered

- Authorized access by each role (RT_ADMIN, RT_CHAIR, TREASURER, RESIDENT, SUPER_ADMIN)
- Unauthorized access (user has no matching permission)
- Cross-tenant read/write isolation (RT A → RT B)
- System RT isolation
- Anonymous access restrictions
- Permission escalation attempts
- JWT claim manipulation
- SECURITY DEFINER function execution context
- Direct table INSERT bypass attempts

Validation SQL: `supabase/tests/rls_validation.sql` (7 sections, 30 test scenarios).

---

# 3. Functional Validation Results

Legend: **PASS** = policy allows expected access · **BLOCK** = policy denies as expected · **BYPASS** = policy does not apply (SECURITY DEFINER or service_role path) · **DEFER** = requires live DB execution

## 3.1 Core Data Tables

| Table | SELECT (authorized) | SELECT (unauthorized) | INSERT | UPDATE | DELETE | Cross-tenant | Notes |
|---|---|---|---|---|---|---|---|
| `residents` | PASS | BLOCK | PASS | PASS | PASS | BLOCK | Full RBAC v2 via 014 |
| `expenses` | PASS | BLOCK | PASS | PASS | PASS | BLOCK | Approve/reject via SD function |
| `payment_confirmations` | PASS | BLOCK | PASS | PASS | — | BLOCK | No DELETE policy — immutable by design |
| `confirmation_details` | PASS | BLOCK | PASS | — | — | BLOCK | Scoped via parent `payment_confirmations` |
| `payments` | PASS | BLOCK | BYPASS | — | — | BLOCK | Inserted only by `approve_confirmation` SD |
| `payment_details` | PASS | BLOCK | BYPASS | — | — | BLOCK | Inserted only by `approve_confirmation` SD |
| `ledger` | PASS | BLOCK | BYPASS | — | — | BLOCK | Inserted only by `insert_ledger` SD (after 024) |

## 3.2 Infrastructure Tables

| Table | SELECT (authorized) | SELECT (unauthorized) | INSERT | UPDATE | DELETE | Cross-tenant | Notes |
|---|---|---|---|---|---|---|---|
| `rt` | PASS (open read) | — | BLOCK (super_admin only) | PASS (admin/chair) | BLOCK (super_admin only) | PASS (update is RT-scoped after 023) | All authenticated can read |
| `users` | PASS (open read) | — | BYPASS | BYPASS | BYPASS | N/A | Writes via supabaseAdmin only |
| `memberships` | PASS (own row) | BLOCK (other user's row) | PASS (RT_ADMIN after 021) | PASS (RT_ADMIN after 021) | PASS (RT_ADMIN after 021) | BLOCK | Two SELECT policies OR'd |
| `registration_requests` | PASS | BLOCK | PASS (anon allowed) | BLOCK | BLOCK | BLOCK | Public submit intentional |
| `activation_invites` | PASS (admin/chair) | BLOCK | BYPASS | BYPASS | BYPASS | BLOCK | Writes via supabaseAdmin |

## 3.3 RBAC v2 Catalog Tables

| Table | SELECT (authorized) | SELECT (unauthorized) | INSERT | UPDATE | DELETE | Cross-tenant | Notes |
|---|---|---|---|---|---|---|---|
| `roles` | PASS (open read) | — | BLOCK | BLOCK | BLOCK | N/A | Catalog; writes via service_role |
| `permissions` | PASS (open read) | — | BLOCK | BLOCK | BLOCK | N/A | Catalog; writes via service_role |
| `role_permissions` | PASS (open read) | — | BLOCK | BLOCK | BLOCK | N/A | Global; no rt_id column |
| `rt_permission_overrides` | PASS (permission.override) | BLOCK | PASS (permission.override) | PASS (permission.override) | PASS (permission.override) | BLOCK | Full CRUD scoped to permission.override |

## 3.4 Communication Tables

| Table | SELECT (authorized) | SELECT (unauthorized) | INSERT | UPDATE | DELETE | Notes |
|---|---|---|---|---|---|---|
| `notifications` | PASS (own notifications) | BLOCK (other user's) | PASS (self only, after 025) | PASS (own, mark-as-read) | — | Cross-user INSERT blocked after 025 |
| `activity_logs` | PASS (RT_ADMIN with audit.view) | BLOCK (TREASURER/RESIDENT) | PASS (own RT) | — | — | Read tightened by 022 |

## 3.5 Storage (`storage.objects`)

| Bucket | Public read | Authenticated upload | Authenticated update | Authenticated delete | Cross-tenant |
|---|---|---|---|---|---|
| `rt-assets` | PASS | PASS (no tenant scope) | PASS (no tenant scope) | PASS (no tenant scope) | DEFER |
| `payment-proof` | PASS | PASS (no tenant scope) | PASS (no tenant scope) | PASS (no tenant scope) | DEFER |
| `expense-receipts` | PASS | PASS (no tenant scope) | PASS (no tenant scope) | PASS (no tenant scope) | DEFER |

Storage cross-tenant isolation is DEFERRED pending path audit (see Section 9).

---

# 4. Cross-Tenant Isolation Analysis

All cross-tenant scenarios were validated by static analysis of `has_permission()` logic.

## 4.1 RT A reads RT B data

**Verdict: BLOCK**

`has_permission(p_rt_id, code)` performs an inner join:
```sql
WHERE m.user_id = auth.uid()
AND   m.rt_id   = p_rt_id
AND   m.status  = 'active'
```

A user with no active membership in RT B will produce no join result, causing
`has_permission` to return `false`. Every table with RBAC v2 policies uses
`has_permission(rt_id, ...)` as the predicate, so RT B data is invisible.

## 4.2 RT A updates RT B data

**Verdict: BLOCK**

Same analysis. The `rt: members can update own rt` policy (after migration 023):
```sql
USING (has_permission(id, 'settings.update'))
```
`id` is `rt.id`. For RT B, `has_permission(rt_b_id, 'settings.update')` returns
false for a user who is only a member of RT A.

## 4.3 RT A deletes RT B data

**Verdict: BLOCK** (for tables with DELETE policies)

`has_permission(rt_id, 'xxx.delete')` blocks all cross-RT deletes on
residents, expenses. Tables without DELETE policies (ledger, payments, notifications)
are append-only or update-only by design.

## 4.4 RT A inserts using RT B identifier

**Verdict: BLOCK**

INSERT WITH CHECK expressions also use `has_permission(rt_id, 'xxx.create')`.
Supplying RT B's UUID in the `rt_id` column of an INSERT causes the WITH CHECK
to evaluate `has_permission(rt_b_id, 'xxx.create')` which returns false for an
RT A member.

## 4.5 System RT isolation

**Verdict: BLOCK**

The `activity_logs: read own rt` policy includes an explicit exclusion:
```sql
USING (has_permission(rt_id, 'audit.view') OR is_super_admin())
```

The System RT (`00000000-...-0001`) has no membership rows for regular users.
`has_permission(system_rt_id, 'audit.view')` returns false for everyone except
SUPER_ADMIN (which has the unconditional bypass).

The old guard in 007 had an explicit:
```sql
rt_id != '00000000-0000-0000-0000-000000000001' AND rt_id IN (get_user_rt_ids())
```
Migration 022 replaced this with `has_permission()`. The system RT is still
implicitly excluded because no regular user holds an active system RT membership.
The explicit `!=` guard was removed but the protection is preserved.

---

# 5. Authorization Bypass Analysis

## 5.1 Unauthorized SELECT

**Result: BLOCKED by RLS**

All RLS-enabled tables default to deny when no policy matches. Policies use
`USING (has_permission(...))` which returns `false` → row is invisible.
No policy returns data for users without a matching membership + permission.

## 5.2 Unauthorized UPDATE

**Result: BLOCKED by RLS**

UPDATE policies use `USING` (row visibility) and/or `WITH CHECK` (write constraint).
Both are guarded by `has_permission()`. An unauthorized UPDATE silently affects
0 rows rather than raising an error (PostgreSQL RLS UPDATE semantics).

## 5.3 Unauthorized DELETE

**Result: BLOCKED by RLS**

DELETE policies use `USING` only. Unauthorized deletes affect 0 rows.

## 5.4 Unauthorized INSERT

**Result: BLOCKED by RLS**

INSERT policies use `WITH CHECK`. A violation raises:
`ERROR: new row violates row-level security policy`

## 5.5 Permission escalation via `rt_permission_overrides`

**Result: BLOCKED**

Migration 020 added full CRUD policies on `rt_permission_overrides` scoped to
`has_permission(rt_id, 'permission.override')`. Only RT_ADMIN holds this permission
by default. A RESIDENT or TREASURER attempting to insert an override row receives
an RLS violation error.

## 5.6 Owner spoofing

**Result: BLOCKED**

All ownership checks (`created_by`, `target_user_id`, `user_id`) are evaluated
from the authenticated `auth.uid()` in the function context. A user cannot
spoof another user's identity by crafting their JWT payload differently —
`auth.uid()` is derived from the validated Supabase JWT `sub` claim and cannot
be overridden by additional custom claims.

## 5.7 Role spoofing via JWT

**Result: BLOCKED**

`has_permission()` and all RLS helpers read from the `memberships` table
(SECURITY DEFINER context) rather than trusting any JWT claim. A JWT that includes
a custom `role` or `rt_id` claim has no effect on the permission evaluation.

## 5.8 Direct `approve_all_pending_expenses` call (pre-027)

**Result: VULNERABLE (fixed by migration 027)**

Before migration 027, any authenticated user could call:
```sql
SELECT approve_all_pending_expenses('<any_rt_id>', '<any_user_id>');
```
via the Supabase browser client. The function is SECURITY DEFINER with no
permission check. Migration 027 restricts EXECUTE to `service_role` only.

---

# 6. SECURITY DEFINER Audit

## 6.1 Pre-RBAC v2 Helpers (005_functions.sql)

| Function | SECURITY DEFINER | Grant scope (post-027) | Risk | Notes |
|---|---|---|---|---|
| `is_super_admin()` | Yes | authenticated | Low | Returns only caller's own status; harmless if called by non-admin. REVOKE PUBLIC added by 027. |
| `get_user_rt_ids()` | Yes | authenticated | Low | Returns only caller's own RT IDs. REVOKE PUBLIC added by 027. |
| `is_member_of_rt(uuid)` | Yes | authenticated | Low | Returns only caller's own membership status. REVOKE PUBLIC added by 027. Orphaned after 014 (no active policies use it) but retained as utility. |
| `insert_ledger(...)` | Yes (as of 019) | service_role | Low | Correct. Only service_role / SD callers can insert ledger rows. |
| `approve_confirmation(uuid,uuid)` | Yes | authenticated + service_role (post-027) | Low | service_role grant added by 027 for consistency. RBAC v2 permission check added by 017. |
| `reject_confirmation(uuid,text,uuid)` | Yes | authenticated + service_role (post-027) | Low | Same as approve_confirmation. |
| `approve_expense(uuid,uuid)` | Yes (as of 019) | authenticated + service_role | Medium | No RBAC v2 permission check inside function. Application layer (`requirePermission`) is the sole guard. |
| `reject_expense(uuid,text,uuid)` | Yes (as of 019) | authenticated + service_role | Medium | Same as approve_expense. |
| `approve_all_pending_expenses(uuid,uuid)` | Yes | service_role (post-027) | **High → Low** | Pre-027: callable by any authenticated user with no check. Post-027: restricted to service_role only. |
| `generate_rt_code()` | Yes | authenticated + anon | Low | Anon read of RT codes. Allows probing of RT code sequence. Low risk; intentional for registration flow. |
| `cleanup_expired_registrations()` | Yes | (no explicit grant) | Low | Maintenance function. No explicit public grant; intended for pg_cron. |
| `prevent_system_rt_delete()` | Yes (trigger) | — | Low | Trigger-only. Not callable from SQL directly. |

## 6.2 RBAC v2 Helpers (013_rbac_functions.sql, 017)

| Function | SECURITY DEFINER | Grant scope | Risk | Notes |
|---|---|---|---|---|
| `has_permission(uuid,text)` | Yes | authenticated | Low | Core policy function. Correctly reads memberships, roles, permissions, rt_permission_overrides. No PUBLIC grant. |
| `current_membership()` | Yes | authenticated | Low | Returns only caller's own memberships. |
| `current_neighborhood()` | Yes | authenticated | Low | Returns only caller's own RT IDs. |
| `user_has_permission(uuid,uuid,text)` | Yes | authenticated + service_role | Low | Explicit user_id variant for SD callers. Correct grant scope. |

## 6.3 Overall SECURITY DEFINER Assessment

All SECURITY DEFINER functions access `memberships` to avoid circular RLS dependencies.
This is the correct pattern for Supabase (documented in 013_rbac_functions.sql).

No function allows a user to read another user's private data.
The one exploitable function (`approve_all_pending_expenses`) is fixed by migration 027.

---

# 7. Performance Observations

## 7.1 `has_permission()` Per-Row Call Pattern

`has_permission(p_rt_id, code)` is a STABLE SECURITY DEFINER SQL function.
It executes a 5-table join (memberships → roles → permissions → role_permissions → rt_permission_overrides).

**Good news:** PostgreSQL caches STABLE function results within a single query.
For a `SELECT ... FROM residents WHERE has_permission(rt_id, 'resident.view')`,
if all rows in the result set belong to one RT (the common case), `has_permission`
is called effectively once per query, not once per row.

**Edge case:** If the query scans rows with multiple distinct `rt_id` values
(rare outside SUPER_ADMIN context), the function is called once per distinct
`(auth.uid(), rt_id)` pair. For normal users this is still 1-2 calls per query.

## 7.2 Index Analysis

### memberships (hot path in `has_permission()`)

```sql
WHERE m.user_id = auth.uid()
AND   m.rt_id   = p_rt_id
AND   m.status  = 'active'
```

**Existing index:** `idx_memberships_user_id ON memberships(user_id)` (004_constraints.sql)

**Assessment:** The existing index narrows to 1–5 rows per user (typical RT member
count). Filtering by `rt_id` and `status` on this tiny result is negligible.
Performance is acceptable for current scale.

**Recommendation:** For production scale (>1,000 memberships per user, e.g., regional
aggregators), add a composite index:
```sql
CREATE INDEX idx_memberships_user_rt_status
    ON memberships (user_id, rt_id, status)
    WHERE status = 'active';
```
This is **not required** for current KasWarga scale but is recommended before
any multi-RT aggregator use case.

### rt_permission_overrides (inside `has_permission()`)

**Existing indexes:** `idx_rt_permission_overrides_rt_id`, `..._role_id`, `..._permission_id` (011_rbac_tables.sql)

**Assessment:** The LEFT JOIN uses `(rt_id, role_id, permission_id)`. The individual
column indexes are adequate. A composite covering index would reduce index merge overhead:
```sql
CREATE INDEX idx_rt_permission_overrides_lookup
    ON rt_permission_overrides (rt_id, role_id, permission_id)
    INCLUDE (allow);
```
**Priority: Low.** The table is small (number of RT-level overrides is bounded by
`#roles × #permissions × #RTs`). Only required if many RTs customize permissions.

### role_permissions

**Existing indexes:** `idx_role_permissions_role_id`, `idx_role_permissions_permission_id` (011_rbac_tables.sql)

**Assessment:** Adequate. The table is small and fully static after seeding.

### Frequently accessed tables (has_permission via RLS)

| Table | RLS predicate column | Index |
|---|---|---|
| `residents` | `rt_id` | `idx_residents_rt_id` ✓ |
| `expenses` | `rt_id` | `idx_expenses_rt_id` ✓ |
| `payment_confirmations` | `rt_id` | `idx_payment_confirmations_rt_id` ✓ |
| `payments` | `rt_id` | `idx_payments_rt_id` ✓ |
| `ledger` | `rt_id` | `idx_ledger_rt` ✓ |
| `activity_logs` | `rt_id` | `idx_activity_logs_rt_id` ✓ |
| `notifications` | `target_user_id` | `idx_notifications_target_user` ✓ |

All primary predicate columns are indexed. No sequential scan risk from RLS predicates
on these tables under normal query patterns.

## 7.3 Subquery Performance (`confirmation_details`, `payment_details`)

These tables have no direct `rt_id` column. Their policies use correlated EXISTS subqueries:
```sql
USING (EXISTS (
    SELECT 1 FROM payment_confirmations pc
    WHERE  pc.id = confirmation_id
    AND    has_permission(pc.rt_id, 'payment.view')
))
```

The `idx_confirmation_details_confirmation_id` and `idx_payment_details_payment_id`
indexes ensure the parent lookup is fast. These tables are append-only and typically
queried alongside their parent, so the EXISTS subquery overhead is acceptable.

---

# 8. Security Hardening Applied

Migration 027 (`023_rbac_security_hardening.sql`) applied three changes:

## 8.1 Restrict `approve_all_pending_expenses` to service_role

**Before:** `GRANT EXECUTE TO authenticated`
**After:** `REVOKE EXECUTE FROM authenticated; GRANT EXECUTE TO service_role`

Any authenticated user who called this function directly bypassed all RBAC v2
permission checks because the function is SECURITY DEFINER with no internal
`user_has_permission` check. Restricting to `service_role` forces all callers
through the API route (`supabaseAdmin.rpc()`), restoring application-layer enforcement.

## 8.2 REVOKE PUBLIC EXECUTE on pre-RBAC v2 helpers

**Functions affected:** `is_super_admin()`, `get_user_rt_ids()`, `is_member_of_rt(uuid)`

**Before:** No explicit REVOKE in 005_functions.sql → PostgreSQL default PUBLIC EXECUTE
**After:** `REVOKE ALL FROM PUBLIC; GRANT EXECUTE TO authenticated`

These are SECURITY DEFINER functions that access `memberships`. Exposing them to
`PUBLIC` (including `anon`) violates least-privilege. In practice they only return
data for `auth.uid()` so the exploit surface was low, but the correct posture is
explicit deny-by-default.

## 8.3 Add service_role EXECUTE grant to approval functions

**Functions affected:** `approve_confirmation(uuid,uuid)`, `reject_confirmation(uuid,text,uuid)`

**Before:** `GRANT TO authenticated` only (017_rbac_fix_payment_approval.sql)
**After:** Additionally `GRANT TO service_role`

These functions are invoked via `supabaseAdmin.rpc()` in the API routes. Supabase's
`service_role` PostgreSQL role currently has broad implicit privileges, so the calls
succeed today — but the explicit grant is absent. Adding it makes the intent clear
and protects against future Supabase privilege hardening that could silently break
payment approval flows.

---

# 9. Outstanding Risks

## Risk A — Storage bucket cross-tenant isolation (HIGH for multi-tenant)

**Status: DEFERRED (migration 026 is a no-op placeholder)**

Storage buckets (`rt-assets`, `payment-proof`, `expense-receipts`) have no
tenant isolation in their upload/update/delete policies. Any authenticated user
from any RT can overwrite or delete objects in any RT's buckets.

**Prerequisite before fixing:** Audit all upload paths in the application to confirm
all three buckets use a consistent `{rt_id}/filename` path convention. If existing
uploaded files do not follow this convention, a retroactive path migration is required
before any RLS policy can correctly extract the RT ID from the object path.

**Mitigation until fixed:** Application-layer validation in API routes prevents
cross-RT uploads in practice. The DB-layer gap only matters if an attacker bypasses
the application.

## Risk B — `approve_expense` / `reject_expense` lack DB-layer RBAC v2 check (MEDIUM)

**Status: Informational**

`approve_expense` and `reject_expense` (migration 019) are SECURITY DEFINER
functions with EXECUTE granted to `authenticated`. They contain no `user_has_permission`
check — only the application-layer `requirePermission` guard in the API routes
prevents unauthorized calls.

Unlike `approve_all_pending_expenses` (which was unrestricted and is fixed in 027),
these single-expense functions are already correctly callable by the TREASURER
(`expense.approve`/`expense.reject`). The gap is that a RESIDENT could call them
directly via the Supabase client library.

**Recommended fix (future sprint):** Add `user_has_permission(p_user_id, v_row.rt_id, 'expense.approve')` check at the start of `approve_expense`, matching the pattern of `approve_confirmation` (017).

## Risk C — `approve_all_pending_expenses` notification pattern is stale (LOW)

**Status: Informational (not blocking)**

This function (005_functions.sql) still contains inline notification INSERTs.
Sprint 4 moved single-expense notifications to API routes (018/019). If `approve_all_pending_expenses` is called (via service_role, post-027), its notifications are
inserted directly into the `notifications` table from within the SD function.
These insertions go through service_role which bypasses RLS, so they will succeed.
However, the notification text format may differ from the API route's format.

**Recommended fix (future sprint):** Move the notification step outside the function
and into the calling API route, matching the Sprint 4 pattern.

## Risk D — SECRETARY role cannot be assigned (INFORMATIONAL)

**Status: Known gap, not a security risk**

The `user_role` enum in the `memberships` table does not include `SECRETARY`.
The SECRETARY role code exists in `roles` and has 10 permission grants in
`role_permissions`, but no user can be assigned it at the DB level.
All SECRETARY permission grants are unreachable. No security impact.

**Recommended fix:** `ALTER TYPE user_role ADD VALUE 'SECRETARY'` when the
Secretary feature is developed.

## Risk E — `generate_rt_code()` accessible to anon (LOW)

**Status: Informational**

This SECURITY DEFINER function is granted to both `authenticated` and `anon`
(005_functions.sql). An anonymous user can call it to probe the next RT code
value, revealing how many RTs exist. The function reads `rt` and
`registration_requests`.

**Assessment:** Acceptable for the current registration flow design (anon
registration forms need to display or verify RT codes). No sensitive data is
exposed beyond the RT count.

---

# 10. Recommendations

Ordered by priority:

| # | Priority | Recommendation | Sprint |
|---|---|---|---|
| 1 | HIGH | Apply migration 027 — security hardening | Immediate |
| 2 | HIGH | Apply migration 026 after completing storage path audit | Next sprint |
| 3 | MEDIUM | Add `user_has_permission` check inside `approve_expense` and `reject_expense` | Sprint 5.4 |
| 4 | MEDIUM | Add composite index `memberships(user_id, rt_id, status)` for production scale | Sprint 5.4 |
| 5 | LOW | Move `approve_all_pending_expenses` notification logic to the API route | Sprint 5.4 |
| 6 | LOW | Add composite covering index on `rt_permission_overrides(rt_id, role_id, permission_id)` | Sprint 5.4 |
| 7 | LOW | Add `SECRETARY` to `user_role` enum when the feature is ready | Feature sprint |
| 8 | INFO | Audit `generate_rt_code()` grant to anon — revoke if registration flow can use supabaseAdmin | Sprint 5.4 |

---

# 11. Validation Artifacts

| Artifact | Path |
|---|---|
| Validation SQL suite | `supabase/tests/rls_validation.sql` |
| Security hardening migration | `supabase/migrations/023_rbac_security_hardening.sql` |
| Sprint 5.1 Assessment | `docs/rbac/RLS_ASSESSMENT.md` |
| Sprint 5.2 Migration Summary | `docs/rbac/RLS_MIGRATION_SUMMARY.md` |
| RLS Policy Reference | `docs/database/RLS_POLICY.md` |
