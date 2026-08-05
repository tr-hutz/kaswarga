# Permission Coverage Report

**Sprint 5.6 — Phase 1**
Generated: 2026-08-03
Branch: feat/rbac-v2-rls-assessment-compatibility

---

## Summary

| Metric | Count |
|--------|-------|
| Permissions in `types.ts` | 55 |
| Permissions seeded in database | 46 |
| Permissions with no seed row | 9 |
| Permissions with no role assignment | 9 |
| Permissions with sidebar navigation | 20 |
| Permissions with route-level guard | 13 |
| Permissions with component-level guard | 11 |
| Permissions with API protection | 14 |
| Permissions with RLS coverage | 22 |

---

## Coverage Matrix

Legend:
- ✅ Implemented
- ⚠️ Partial (auth check only, no permission check)
- ❌ Missing
- N/A Not applicable (transactional permission, no dedicated page)

| Permission | Code | Seeded | Sidebar | Route Guard | Component Guard | API | RLS |
|---|---|---|---|---|---|---|---|
| RESIDENT_VIEW | resident.view | ✅ | `/residents` | ✅ | N/A | N/A | residents SELECT |
| RESIDENT_CREATE | resident.create | ✅ | N/A | N/A | N/A | `/api/residents/import` | residents INSERT |
| RESIDENT_UPDATE | resident.update | ✅ | N/A | N/A | N/A | N/A | residents UPDATE |
| RESIDENT_DELETE | resident.delete | ✅ | N/A | N/A | N/A | N/A | residents DELETE |
| RESIDENT_APPROVE | resident.approve | ✅ | N/A | N/A | N/A | `/api/invite`, `/api/resend-invite` | registration_requests UPDATE/DELETE |
| RESIDENT_REJECT | resident.reject | ✅ | N/A | N/A | N/A | N/A | registration_requests DELETE |
| RESIDENT_EXPORT | resident.export | ✅ | N/A | N/A | ✅ ResidentView | N/A | ❌ |
| RESIDENT_IMPORT | resident.import | ✅ | N/A | N/A | ✅ ResidentView | `/api/residents/import` | ❌ |
| MEMBERSHIP_VIEW | membership.view | ✅ | N/A | N/A | N/A | N/A | ❌ (no SELECT policy) |
| MEMBERSHIP_CREATE | membership.create | ✅ | N/A | N/A | N/A | N/A | memberships INSERT |
| MEMBERSHIP_UPDATE | membership.update | ✅ | N/A | N/A | N/A | N/A | memberships UPDATE |
| MEMBERSHIP_DELETE | membership.delete | ✅ | N/A | N/A | N/A | N/A | memberships DELETE |
| PAYMENT_VIEW | payment.view | ✅ | `/payments` | ❌ | N/A | N/A | payments/confirmations SELECT |
| PAYMENT_CREATE | payment.create | ✅ | N/A | N/A | ✅ PaymentView | N/A | payments/confirmations INSERT |
| PAYMENT_UPDATE | payment.update | ✅ | N/A | N/A | N/A | `/api/payments/import` | ❌ |
| PAYMENT_DELETE | payment.delete | ✅ | N/A | N/A | N/A | `/api/payments/delete-all-imported` | ❌ |
| PAYMENT_APPROVE | payment.approve | ✅ | N/A | N/A | ✅ PaymentView | `/api/payments/approve`, `approve-all-imported` | ❌ |
| PAYMENT_REJECT | payment.reject | ✅ | N/A | N/A | ✅ PaymentView | `/api/payments/reject`, `reject-all-imported` | ❌ |
| DASHBOARD_PAYMENT_EXPORT | dashboard.payment.export | ✅ | N/A | N/A | ✅ DashboardView, PaymentView | N/A | ❌ |
| DASHBOARD_PAYMENT_ARREARS | dashboard.payment.arrears | ✅ | N/A | N/A | ✅ DashboardView | N/A | ❌ |
| EXPENSE_VIEW | expense.view | ✅ | `/expenses` | ❌ | N/A | N/A | expenses SELECT |
| EXPENSE_CREATE | expense.create | ✅ | N/A | N/A | ✅ ExpenseView | `/api/expenses/import` | expenses INSERT |
| EXPENSE_UPDATE | expense.update | ✅ | N/A | N/A | N/A | N/A | expenses UPDATE |
| EXPENSE_DELETE | expense.delete | ✅ | N/A | N/A | N/A | N/A | expenses DELETE |
| EXPENSE_APPROVE | expense.approve | ✅ | N/A | N/A | ✅ ExpenseView, ExpenseDrawer | `/api/expenses/approve`, `approve-all` | ❌ |
| EXPENSE_REJECT | expense.reject | ✅ | N/A | N/A | ✅ ExpenseView | `/api/expenses/reject` | ❌ |
| EXPENSE_EXPORT | expense.export | ✅ | N/A | N/A | ✅ ExpenseView | N/A | ❌ |
| EXPENSE_IMPORT | expense.import | ✅ | N/A | N/A | ✅ ExpenseView | `/api/expenses/import` | ❌ |
| LEDGER_VIEW | ledger.view | ✅ | `/ledger` | ✅ | N/A | N/A | ledger SELECT |
| LEDGER_EXPORT | ledger.export | ✅ | N/A | N/A | N/A | `/api/ledger/report` | ❌ |
| REPORT_VIEW | report.view | ✅ | N/A | ❌ | N/A | N/A | ❌ |
| REPORT_EXPORT | report.export | ✅ | N/A | N/A | N/A | N/A | ❌ |
| ANNOUNCEMENT_VIEW | announcement.view | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ANNOUNCEMENT_CREATE | announcement.create | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ANNOUNCEMENT_UPDATE | announcement.update | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ANNOUNCEMENT_DELETE | announcement.delete | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| EVENT_VIEW | event.view | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| EVENT_CREATE | event.create | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| EVENT_UPDATE | event.update | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| EVENT_DELETE | event.delete | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SETTINGS_VIEW | settings.view | ✅ | `/rt-profile` | ✅ | N/A | N/A | activation_invites SELECT |
| SETTINGS_UPDATE | settings.update | ✅ | N/A | N/A | N/A | N/A | rt UPDATE |
| RT_DELETE | rt.delete | ❌ | ❌ | N/A | N/A | `/api/rt/[id]` DELETE | ❌ |
| USER_VIEW | user.view | ✅ | `/rt`, `/rt/registration`, `/users` | ✅ | N/A | N/A | ❌ |
| USER_CREATE | user.create | ✅ | N/A | N/A | N/A | N/A | ❌ |
| USER_UPDATE | user.update | ✅ | N/A | N/A | N/A | N/A | ❌ |
| USER_DELETE | user.delete | ✅ | N/A | N/A | N/A | N/A | ❌ |
| ROLE_VIEW | role.view | ✅ | `/settings/authorization/roles` | ✅ | N/A | N/A | roles SELECT (open) |
| ROLE_CREATE | role.create | ✅ | N/A | N/A | N/A | N/A | ❌ |
| ROLE_UPDATE | role.update | ✅ | N/A | N/A | N/A | N/A | ❌ |
| PERMISSION_VIEW | permission.view | ✅ | `/settings/authorization/permissions`, `/settings/authorization/viewer` | ✅ | N/A | `/api/permissions/[id]/details`, `/api/roles/[id]/override-count` | permissions SELECT (open) |
| PERMISSION_UPDATE | permission.update | ✅ | N/A | N/A | N/A | N/A | ❌ |
| PERMISSION_OVERRIDE | permission.override | ✅ | `/settings/authorization/overrides` | ✅ | N/A | N/A | rt_permission_overrides CRUD |
| AUDIT_VIEW | audit.view | ✅ | N/A | ⚠️ auth-only | N/A | N/A | activity_logs SELECT |
| INSPECTOR_VIEW | rbac.inspector.view | ✅ (016) | `/settings/authorization/inspector` | ✅ | N/A | N/A | ❌ |

---

## Gap Analysis

### Pages Missing Route-Level Permission Guard

The following routes use `getRequestContext()` for authentication but do **not** check a specific permission before rendering:

| Route | Current State | Expected Permission |
|-------|--------------|---------------------|
| `/activity` | `getRequestContext()` only | `AUDIT_VIEW` |
| `/payments` | No server guard | `PAYMENT_VIEW` |
| `/expenses` | No server guard | `EXPENSE_VIEW` |
| `/dashboard` | No server guard | None (general page) |
| `/` (home) | No server guard | None (general page) |
| `/notification` | No server guard | None (general page) |

> **Note:** `/dashboard`, `/`, and `/notification` do not map to a specific permission and are intentionally open to all authenticated RT members. The gaps in `/activity`, `/payments`, and `/expenses` are meaningful — these pages render sensitive data.

### API Routes Without `requirePermission`

The following API routes perform operations without `requirePermission()`:

| Route | Method | Risk Level | Notes |
|-------|--------|-----------|-------|
| `/api/activate` | POST | LOW | Activation token required; effectively self-service |
| `/api/roles` | GET | LOW | Reads catalog data; roles table has open RLS SELECT |
| `/api/roles/[id]` | GET | LOW | Same as above |
| `/api/roles/[id]/permissions` | GET | LOW | Same as above |
| `/api/members` | GET | MEDIUM | Reads membership data; no permission check |
| `/api/members/[membershipId]/overrides` | GET/POST | MEDIUM | Reads/writes per-member overrides without `PERMISSION_OVERRIDE` check |
| `/api/permissions` | GET | LOW | Reads catalog data; permissions table has open RLS SELECT |
| `/api/activity` | GET | MEDIUM | Reads audit logs; RLS enforces `audit.view` at DB layer |
| `/api/payments/notify` | POST | LOW | Notification trigger; limited surface |

> **Note:** `/api/activity` is protected at the RLS layer by `audit.view`. The absence of an application-layer check means an authenticated user without `audit.view` would receive a filtered (empty) result rather than a 403 — a degraded experience but not a security hole.

### Permissions With No RLS Coverage

These permissions control operations that modify data but have no corresponding RLS policy enforcing the permission at the database layer. The application layer (`requirePermission`) is the only enforcement point:

- `PAYMENT_UPDATE`, `PAYMENT_DELETE`, `PAYMENT_APPROVE`, `PAYMENT_REJECT`
- `EXPENSE_APPROVE`, `EXPENSE_REJECT`, `EXPENSE_EXPORT`, `EXPENSE_IMPORT`
- `LEDGER_EXPORT`
- `RESIDENT_EXPORT`, `RESIDENT_IMPORT`

For these, the API route's `requirePermission()` call is the authoritative guard. If a new code path is added without that call, the operation is unprotected.

### Permissions With No Coverage At All

These 9 constants are declared in `lib/auth/types.ts` but have zero coverage anywhere in the application:

- `ANNOUNCEMENT_VIEW`, `ANNOUNCEMENT_CREATE`, `ANNOUNCEMENT_UPDATE`, `ANNOUNCEMENT_DELETE`
- `EVENT_VIEW`, `EVENT_CREATE`, `EVENT_UPDATE`, `EVENT_DELETE`
- `RT_DELETE` — seeded by `api/rt/[id]` use but **not seeded in the database**

See the [Dead Permission Report](DEAD_PERMISSION_REPORT.md) for full analysis.

---

## Inspector Coverage

The Permission Inspector (`/settings/authorization/inspector`) shows the effective permission set for any member. It reads from `PermissionService` which resolves:
1. `role_permissions` rows for the member's role
2. `rt_permission_overrides` for the specific RT

The Inspector correctly reflects all 46 seeded permissions. The 9 unseeded PERMISSION constants (`announcement.*`, `event.*`, `rt.delete`) do not appear in the Inspector because they have no database rows.
