# RBAC Consistency Validator Report

**Sprint 5.6 — Phase 4**
Generated: 2026-08-03
Branch: feat/rbac-v2-rls-assessment-compatibility

---

## Summary

| Check | Issues Found |
|-------|-------------|
| Naming convention violations | 3 (all accepted/documented) |
| Duplicate guards | 0 |
| Duplicate helper functions | 0 |
| Duplicate authorization logic | 1 (isSuperAdmin pattern) |
| Legacy authorization remnants | 1 (old RLS patterns in 007_rls) |
| Inconsistent protection patterns | 3 (routes) |
| Hardcoded role names | 0 |

---

## 1. Naming Convention

### Permission Code Format

The standard is `module.action` (two parts). Three active codes use three parts:

| Code | Justification | Status |
|------|--------------|--------|
| `dashboard.payment.export` | Dashboard-scoped variant of payment export | Accepted deviation |
| `dashboard.payment.arrears` | Dashboard-scoped arrears view | Accepted deviation |
| `rbac.inspector.view` | Sub-feature `inspector` within `rbac` module | Accepted deviation |

These were intentionally named to avoid collision with the base payment/expense modules. The deviation is acceptable but should be documented in `PERMISSION_CATALOG.md`.

### PERMISSION Constant Naming

All PERMISSION constants follow `UPPER_SNAKE_CASE`. No violations found.

### ROLE_CODE Constant Naming

All ROLE_CODE constants follow `UPPER_SNAKE_CASE`. No violations found.

---

## 2. Duplicate Authorization Logic

### `isSuperAdmin` Pattern Appears in Multiple Components

The check `membership?.role === 'SUPER_ADMIN'` is performed in four places:

| File | Usage |
|------|-------|
| `components/layout/AppShell.tsx` | Route protection (isForbidden) |
| `components/layout/SidebarMenu.tsx` | Navigation filtering |
| `features/activity/ActivityContainer.tsx` | Analytics card toggle |
| `features/activity/ActivityAnalytics.tsx` | Conditional render |

**Assessment:** This is a minor consistency issue. The pattern is correct in all four places. However, if the SUPER_ADMIN role code ever changed (it won't — it's seeded as a system role), all four sites would need updating. The `useAuth()` hook already exposes `membership.role` so no abstraction is needed — the check is cheap and readable. The pattern is acceptable as-is.

**Status:** Acceptable. No action required.

---

## 3. Inconsistent Route Protection Patterns

Three patterns exist for page-level authorization:

### Pattern A — Full permission check (correct)
```typescript
// app/residents/page.tsx, app/ledger/page.tsx
const ctx  = await getRequestContext()
const auth = ctx.authorization
if (!auth.hasPermission(PERMISSION.RESIDENT_VIEW)) return <ForbiddenState />
```
Used by: `/residents`, `/ledger`, `/rt-profile`, `/settings/authorization/*`, `/rt`, `/rt/registration`, `/users`

### Pattern B — Auth-only, no permission check (partial)
```typescript
// app/activity/page.tsx
await getRequestContext()
// ← no hasPermission() call
```
Used by: `/activity`

**Issue:** `/activity` renders audit-log content but does not enforce `AUDIT_VIEW` at the route level. The RLS policy on `activity_logs` enforces `audit.view` at the DB layer, so unauthorized users receive empty data rather than a 403. The user experience is degraded (empty page) rather than a clear access-denied message.

### Pattern C — No server protection at all
Used by: `/payments`, `/expenses`, `/dashboard`

**Issue:** These pages have no `getRequestContext()` call. An unauthenticated request would reach the container, which uses `useAuth()` (client-side) to redirect. This is a defense-in-depth gap: the server renders the page shell before the client-side redirect fires.

**Recommendation:**
- `/activity`: add `if (!auth.hasPermission(PERMISSION.AUDIT_VIEW)) return <ForbiddenState />`
- `/payments`: add `getRequestContext()` + `PAYMENT_VIEW` guard
- `/expenses`: add `getRequestContext()` + `EXPENSE_VIEW` guard

---

## 4. Legacy Authorization Remnants

### Migration 007 (`007_rls.sql`)

`007_rls.sql` contains the original RLS policies that used `get_user_rt_ids()` and role-name-based checks. Most have been replaced by later migrations (014–027), but the file itself was not dropped — it remains in migration history.

**Assessment:** This is not a bug. Old policies were replaced via `DROP POLICY IF EXISTS` / `ALTER POLICY` in later migrations. The old SQL in `007_rls.sql` is executed once during fresh provisioning, and then immediately overridden by the subsequent migrations. On an existing database, the old policies were replaced in place. There is no double-policy issue.

**Status:** Historical artifact — no action required.

### `get_user_rt_ids()` References

`get_user_rt_ids()` is still referenced by `007_rls.sql` (historical) and by the original membership READ policy. Later migrations replaced the key policies but some table-level policies (e.g., notifications, users) still use the older pattern.

| Table | Policy | Pattern |
|-------|--------|---------|
| `activity_logs` | read | Replaced with `has_permission(rt_id, 'audit.view')` in 022 ✅ |
| `memberships` | read | Original `get_user_rt_ids()` pattern — no write RLS needed (007) |
| `rt` | update | Replaced with `has_permission(id, 'settings.update')` in 023 ✅ |
| `notifications` | read | `get_user_rt_ids()` pattern remains (007) |
| `users` | read | No RLS (users table — open read via service_role) |

**Assessment:** `notifications` retains the old pattern because the notification read access is intentionally broad (any RT member can see their RT's notifications). Upgrading to a specific permission is not necessary unless a notification-level permission is added in the future.

---

## 5. Hardcoded Role Names

No hardcoded role name strings (e.g., `'ADMIN'`, `'CHAIR'`) were found in application code. All role comparisons use `ROLE_CODE` constants or the `membership.role` field from `useAuth()`.

**Exception:** `components/layout/SidebarMenu.tsx` and `components/layout/AppShell.tsx` compare `membership.role === 'SUPER_ADMIN'`. This is correct — `SUPER_ADMIN` is a `MembershipRole` enum value in the membership shape, not a `ROLE_CODE` constant. The value is identical (`'SUPER_ADMIN'`) but comes from the auth layer, not from `lib/auth/types.ts`.

---

## 6. Duplicate Permission Guards

No route or component was found applying the same permission check twice. No guard is both at the route level and within the container for the same permission (which would be redundant but harmless).

---

## 7. Navigation Config Consistency

`lib/navigation/navigation-config.ts` uses `PERMISSION.USER_VIEW` as the permission for three SUPER_ADMIN-only items (`/rt`, `/rt/registration`, `/users`). Because `isSuperAdmin` bypasses the permission check in `SidebarMenu.tsx`, this permission assignment is never evaluated for SUPER_ADMIN — it is effectively dead configuration. However, it is harmless and provides documentation of which permission would gate these items if the `noRt` check were ever removed.

**Status:** Acceptable as-is.

---

## 8. PERMISSION_SERVICE Bypass

`SuperAdminPermissionSet` in `lib/auth/permission-service.ts` returns all PERMISSION values for SUPER_ADMIN. This set is built from the `PERMISSION` object at runtime, so it includes the 9 unseeded constants (`announcement.*`, `event.*`, `rt.delete`). This means SUPER_ADMIN is technically shown as having these permissions in the inspector, even though they have no DB rows. This is a cosmetic inconsistency rather than a security issue.

**Status:** Low priority. Resolves naturally when the planned features are built and the permissions are seeded.
