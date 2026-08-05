# Dead Permission Report

**Sprint 5.6 — Phase 2**
Generated: 2026-08-03
Branch: feat/rbac-v2-rls-assessment-compatibility

---

## Summary

| Issue | Count |
|-------|-------|
| Declared in `types.ts`, not seeded in DB | 9 |
| In `PERMISSION_CATALOG.md`, not in `types.ts` or DB | 4 |
| Naming convention violations | 3 |
| Duplicate permission codes | 0 |
| Referenced but not declared | 0 |

---

## 1. Declared but Not Seeded

These PERMISSION constants exist in `lib/auth/types.ts` but have no corresponding row in the `permissions` table (not present in `012_rbac_seed.sql` or any subsequent migration).

### Announcement Module (Planned Feature)

| Constant | Code | Status |
|----------|------|--------|
| `ANNOUNCEMENT_VIEW` | `announcement.view` | Phantom — no DB row, no UI, no routes |
| `ANNOUNCEMENT_CREATE` | `announcement.create` | Phantom — no DB row, no UI, no routes |
| `ANNOUNCEMENT_UPDATE` | `announcement.update` | Phantom — no DB row, no UI, no routes |
| `ANNOUNCEMENT_DELETE` | `announcement.delete` | Phantom — no DB row, no UI, no routes |

**Assessment:** These constants were pre-declared for a future Announcements feature that has not been implemented. They cause no runtime errors (unused constants are dead code), but they inflate the PERMISSION object and can mislead developers scanning for active permissions.

**Recommendation:** Keep the constants but add a `// planned` comment. Do not seed until the feature is built.

### Event Module (Planned Feature)

| Constant | Code | Status |
|----------|------|--------|
| `EVENT_VIEW` | `event.view` | Phantom — no DB row, no UI, no routes |
| `EVENT_CREATE` | `event.create` | Phantom — no DB row, no UI, no routes |
| `EVENT_UPDATE` | `event.update` | Phantom — no DB row, no UI, no routes |
| `EVENT_DELETE` | `event.delete` | Phantom — no DB row, no UI, no routes |

**Assessment:** Same as announcement module — pre-declared for a planned Events feature.

**Recommendation:** Keep the constants but add a `// planned` comment. Do not seed until the feature is built.

### RT Management

| Constant | Code | Status |
|----------|------|--------|
| `RT_DELETE` | `rt.delete` | No DB row — BUT used by `/api/rt/[id]` DELETE |

**Assessment:** This is the most critical finding. The constant is referenced in `app/api/rt/[id]/route.ts` with `requirePermission(ctx.authorization, PERMISSION.RT_DELETE)`. Because the permission code has no row in the `permissions` table and no entry in `role_permissions`, `has_permission()` always returns `false` for this code — even for RT_ADMIN. The API route is therefore **effectively inaccessible to any non-SUPER_ADMIN user**. SUPER_ADMIN bypasses the check via `is_super_admin()`.

**Recommendation:** Seed `rt.delete` and assign it to SUPER_ADMIN's role_permissions row (or rely on SUPER_ADMIN bypass and document this explicitly). Since SUPER_ADMIN is the only role that should delete RTs, the current behavior is accidentally correct — but the missing seed row is a latent bug.

---

## 2. In Catalog but Not in Code

`docs/database/PERMISSION_CATALOG.md` lists a `document` module that does not exist in `lib/auth/types.ts` or in any migration:

| Catalog Entry | Code | Status |
|---------------|------|--------|
| Document View | `document.view` | Ghost — catalog only |
| Document Create | `document.create` | Ghost — catalog only |
| Document Update | `document.update` | Ghost — catalog only |
| Document Delete | `document.delete` | Ghost — catalog only |

**Assessment:** These appear to be a legacy planning artifact. No code references these codes. The catalog is out of sync.

**Recommendation:** Remove the `document.*` section from `PERMISSION_CATALOG.md`.

### Additional Catalog Gaps

The following permissions are **active** (seeded and used) but **missing** from `PERMISSION_CATALOG.md`:

| Missing from Catalog | Code |
|----------------------|------|
| Export Payment (dashboard) | `dashboard.payment.export` |
| Dashboard Payment Arrears | `dashboard.payment.arrears` |
| RBAC Inspector View | `rbac.inspector.view` |
| RT Delete | `rt.delete` |
| Export Expense | `expense.export` |
| Import Expense | `expense.import` |
| Approve Expense | `expense.approve` |
| Reject Expense | `expense.reject` |
| Export Resident | `resident.export` |
| Import Resident | `resident.import` |

**Recommendation:** Update `PERMISSION_CATALOG.md` to reflect the complete active permission set.

---

## 3. Naming Convention Violations

The project convention for permission codes is `module.action` (two parts). Three codes deviate:

| Constant | Code | Issue |
|----------|------|-------|
| `INSPECTOR_VIEW` | `rbac.inspector.view` | Three-part code: `module.submodule.action` |
| `DASHBOARD_PAYMENT_EXPORT` | `dashboard.payment.export` | Three-part code |
| `DASHBOARD_PAYMENT_ARREARS` | `dashboard.payment.arrears` | Three-part code |

**Assessment:**
- `dashboard.payment.export` and `dashboard.payment.arrears` were intentionally given three-part codes to namespace dashboard-specific payment operations away from the payment module's write permissions. This is an accepted convention deviation.
- `rbac.inspector.view` uses three parts because `rbac` is the module, `inspector` is the sub-feature, and `view` is the action. This is also intentional but should be documented.

**Recommendation:** Document the accepted three-part exceptions in `PERMISSION_CATALOG.md`. No code change required since permission codes are immutable after seeding.

---

## 4. Duplicate Detection

No duplicate permission codes were found in `types.ts`.

No duplicate permission codes were found in `012_rbac_seed.sql` or `016_rbac_inspector_permission.sql`.

---

## 5. Referenced but Not Declared

No permission strings were found referenced in route handlers, components, or RLS policies that are not declared as PERMISSION constants.

All strings passed to `requirePermission()`, `has_permission()`, `<Can>`, and `usePermission()` use the PERMISSION constant — not raw string literals — preventing undeclared-reference errors.

---

## Action Items

| Priority | Action | File |
|----------|--------|------|
| HIGH | Seed `rt.delete` or document SUPER_ADMIN-only bypass | `supabase/migrations/` new migration |
| MEDIUM | Update `PERMISSION_CATALOG.md` to add 10 missing active permissions | `docs/database/PERMISSION_CATALOG.md` |
| MEDIUM | Remove `document.*` ghost entries from `PERMISSION_CATALOG.md` | `docs/database/PERMISSION_CATALOG.md` |
| LOW | Add `// planned` comments to `announcement.*` and `event.*` constants | `lib/auth/types.ts` |
| LOW | Document three-part naming exceptions in `PERMISSION_CATALOG.md` | `docs/database/PERMISSION_CATALOG.md` |
