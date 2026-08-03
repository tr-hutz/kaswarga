# Role Coverage Report

**Sprint 5.6 — Phase 3**
Generated: 2026-08-03
Branch: feat/rbac-v2-rls-assessment-compatibility

---

## Summary

| Role | Grants | Notes |
|------|--------|-------|
| SUPER_ADMIN | 0 | Bypasses permission system via `is_super_admin()` |
| RT_ADMIN | 38 | 37 from migration 012 + 1 from migration 016 |
| RT_CHAIR | 21 | |
| TREASURER | 19 | 18 from 012 comment + `dashboard.payment.arrears` |
| SECRETARY | 10 | |
| RESIDENT | 5 | |
| **Total** | **93** | |

---

## Role-Permission Matrix

✅ = granted by default | — = not granted

| Permission | SA | RT_ADMIN | RT_CHAIR | TREASURER | SECRETARY | RESIDENT |
|---|---|---|---|---|---|---|
| resident.view | ✅ bypass | ✅ | ✅ | ✅ | ✅ | ✅ |
| resident.create | ✅ bypass | ✅ | ✅ | — | ✅ | — |
| resident.update | ✅ bypass | ✅ | ✅ | — | ✅ | — |
| resident.delete | ✅ bypass | ✅ | ✅ | — | ✅ | — |
| resident.approve | ✅ bypass | ✅ | ✅ | — | — | — |
| resident.reject | ✅ bypass | ✅ | ✅ | — | — | — |
| resident.export | ✅ bypass | ✅ | — | — | — | — |
| resident.import | ✅ bypass | ✅ | — | — | — | — |
| membership.view | ✅ bypass | ✅ | ✅ | — | ✅ | — |
| membership.create | ✅ bypass | ✅ | ✅ | — | — | — |
| membership.update | ✅ bypass | ✅ | ✅ | — | — | — |
| membership.delete | ✅ bypass | ✅ | ✅ | — | — | — |
| payment.view | ✅ bypass | ✅ | ✅ | ✅ | ✅ | ✅ |
| payment.create | ✅ bypass | ✅ | ✅ | ✅ | — | ✅ |
| payment.update | ✅ bypass | ✅ | — | ✅ | — | — |
| payment.delete | ✅ bypass | ✅ | — | ✅ | — | — |
| payment.approve | ✅ bypass | ✅ | ✅ | ✅ | — | — |
| payment.reject | ✅ bypass | ✅ | ✅ | ✅ | — | — |
| dashboard.payment.export | ✅ bypass | ✅ | — | ✅ | ✅ | — |
| dashboard.payment.arrears | ✅ bypass | — | — | ✅ | — | — |
| expense.view | ✅ bypass | ✅ | ✅ | ✅ | ✅ | ✅ |
| expense.create | ✅ bypass | — | — | ✅ | — | — |
| expense.update | ✅ bypass | — | — | ✅ | — | — |
| expense.delete | ✅ bypass | — | — | ✅ | — | — |
| expense.approve | ✅ bypass | — | ✅ | — | — | — |
| expense.reject | ✅ bypass | — | ✅ | — | — | — |
| expense.export | ✅ bypass | — | — | ✅ | — | — |
| expense.import | ✅ bypass | — | — | ✅ | — | — |
| ledger.view | ✅ bypass | ✅ | ✅ | ✅ | — | ✅ |
| ledger.export | ✅ bypass | ✅ | ✅ | ✅ | — | — |
| report.view | ✅ bypass | ✅ | ✅ | ✅ | ✅ | — |
| report.export | ✅ bypass | ✅ | ✅ | ✅ | ✅ | — |
| settings.view | ✅ bypass | ✅ | ✅ | — | — | — |
| settings.update | ✅ bypass | ✅ | ✅ | — | — | — |
| user.view | ✅ bypass | ✅ | — | — | — | — |
| user.create | ✅ bypass | ✅ | — | — | — | — |
| user.update | ✅ bypass | ✅ | — | — | — | — |
| user.delete | ✅ bypass | ✅ | — | — | — | — |
| role.view | ✅ bypass | ✅ | — | — | — | — |
| role.create | ✅ bypass | ✅ | — | — | — | — |
| role.update | ✅ bypass | ✅ | — | — | — | — |
| permission.view | ✅ bypass | ✅ | — | — | — | — |
| permission.update | ✅ bypass | ✅ | — | — | — | — |
| permission.override | ✅ bypass | ✅ | — | — | — | — |
| audit.view | ✅ bypass | ✅ | — | — | — | — |
| rbac.inspector.view | ✅ bypass | ✅ | — | — | — | — |

**Not seeded (no role assignments):** `announcement.*` (4), `event.*` (4), `rt.delete` (1)

---

## Observations

### RT_ADMIN Is the Only Role With Admin-Level Permissions

RT_ADMIN is the sole role (aside from SUPER_ADMIN bypass) with access to:
- User management (`user.*`)
- Role management (`role.*`)
- Permission management (`permission.*`)
- Audit log access (`audit.view`)
- RBAC inspector (`rbac.inspector.view`)
- Resident export/import

No other role can grant or modify permissions — overrides require `permission.override`, which only RT_ADMIN holds by default.

### Expense Write/Approve Split

The expense module deliberately splits write and approval authority:
- TREASURER: create, update, delete, export, import (operational)
- RT_CHAIR: approve, reject (oversight)
- RT_ADMIN: view only (no write, no approve)

This enforces a separation-of-duties pattern. RT_ADMIN can override this via `rt_permission_overrides` if the RT requires it.

### SECRETARY Has Limited Write Access

SECRETARY has read access to resident, payment, expense, membership, and report data, plus `resident.create/update/delete`. SECRETARY cannot approve residents, manage payments, or modify any financial data.

### RESIDENT Has Minimal Scope

RESIDENT can view resident data, view/submit payments, view expenses, and view the ledger. No write access beyond payment submission.

### `dashboard.payment.arrears` Is TREASURER-Only

This is the only permission assigned exclusively to TREASURER (and SUPER_ADMIN bypass). No other role sees the payment arrears dashboard card.

---

## Unused Roles

All 6 system roles have at least one grant or an explicit bypass (SUPER_ADMIN). No unused roles.

---

## Missing Default Assignments

Compared to `docs/planning/DEFAULT_ROLE_MATRIX.md`, the following discrepancies exist:

| Gap | Details |
|-----|---------|
| DEFAULT_ROLE_MATRIX lists `document.*` permissions | These permissions do not exist in the system. The matrix is stale. |
| DEFAULT_ROLE_MATRIX does not list `dashboard.payment.export` | This permission is active and assigned to RT_ADMIN, TREASURER, SECRETARY. |
| DEFAULT_ROLE_MATRIX does not list `dashboard.payment.arrears` | Active, TREASURER-only. |
| DEFAULT_ROLE_MATRIX does not list `expense.approve/reject/export/import` | All four are active. |
| DEFAULT_ROLE_MATRIX does not list `resident.export/import` | Both are active. |
| DEFAULT_ROLE_MATRIX does not list `rbac.inspector.view` | Active, RT_ADMIN-only. |

**Recommendation:** Update `docs/planning/DEFAULT_ROLE_MATRIX.md` to match the current permission catalog and role assignments.

---

## Override System

Per-RT overrides via `rt_permission_overrides` allow:
- Granting a permission to a role that does not hold it by default
- Revoking a default permission from a role

Override changes are visible in the Permission Inspector at `/settings/authorization/inspector`.

Only users with `permission.override` (RT_ADMIN by default) can manage overrides.
