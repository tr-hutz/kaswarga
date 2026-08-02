# RLS_POLICY.md

> Project: KasWarga
>
> Version: 2.0 (RBAC v2)

---

# Purpose

This document defines the Row-Level Security (RLS) strategy used by KasWarga.

RLS provides the final authorization layer protecting all application data.

Even if the application layer fails, PostgreSQL must continue enforcing data isolation.

---

# Design Principles

KasWarga follows a Defense in Depth security model.

Authorization is enforced at multiple layers:

```
Authentication

↓

AuthorizationContext

↓

Business Service

↓

Repository

↓

PostgreSQL RLS
```

PostgreSQL RLS is the final security boundary.

---

# Authorization Model

RLS must never depend directly on role names.

Incorrect

```
role = 'TREASURER'
```

Correct

```
has_permission(
    'payment.approve'
)
```

Permission evaluation is independent from organizational roles.

---

# Effective Permission

RLS evaluates the effective permission of the authenticated user.

Effective Permission is calculated from:

```
Assigned Role

↓

Role Permissions

↓

Permission Overrides

↓

Effective Permission
```

RLS never evaluates Role directly.

---

# Neighborhood Isolation

Every query must remain isolated to its own RT.

```
Membership

↓

Neighborhood

↓

Accessible Data
```

Cross-RT access is prohibited unless explicitly authorized.

---

# Permission Evaluation

The application provides the authenticated identity.

RLS validates whether the authenticated user owns the required permission.

Example

```
payment.approve
```

or

```
expense.delete
```

The permission name is evaluated instead of organizational role.

---

# Policy Categories

Typical policy groups include:

## Read

View records.

## Create

Insert records.

## Update

Modify records.

## Delete

Soft Delete or physical deletion where permitted.

Each operation should have an independent policy.

---

# Example

Instead of

```
Treasurer may approve payment.
```

Policy becomes

```
Current user owns
payment.approve
permission.
```

Business Rules determine whether approval is allowed.

RLS determines whether the user may execute the operation.

---

# Authorization Flow

```
Authenticated User

↓

AuthorizationContext

↓

Business Service

↓

Repository

↓

PostgreSQL RLS

↓

Database
```

Every protected operation must successfully pass all stages.

---

# Permission Override

Permission Overrides are transparent to RLS.

RLS evaluates only the effective permission.

It does not distinguish whether the permission originates from:

- Default Role
- RT Override

---

# Runtime Dependency

RLS relies on:

- authenticated user
- active membership
- effective permission

It never depends on:

- UI
- React
- Navigation
- Route visibility

---

# Security Rules

RLS must guarantee:

✓ Cross-RT isolation

✓ Permission enforcement

✓ Default deny

✓ Least privilege

✓ Defense in Depth

---

# Default Deny

When authorization cannot be determined,

the operation must be denied.

```
Permission Unknown

↓

DENY
```

Fail-open behavior is prohibited.

---

# Performance

RLS policies should remain deterministic.

Permission evaluation should rely on indexed tables.

Recursive permission evaluation should be avoided.

---

# Testing

Every policy must be verified using:

- Positive test
- Negative test
- Cross-RT test
- Permission Override test
- Anonymous access test

---

# Audit

Sensitive operations protected by RLS should generate Audit Logs.

Typical examples:

- Payment Approval
- Expense Update
- Resident Approval
- Permission Override Update

---

# Architecture Decision

RLS is the final authorization layer.

Application code may evolve.

Business Rules may evolve.

Permission assignments may evolve.

RLS remains the final protection ensuring that unauthorized data access is impossible.

---

# Sprint 5.2 — RBAC v2 Integration Changes

Applied in migrations 020–025 (026 deferred). All changes are incremental and
backward compatible. No existing policy was dropped without an approved replacement.

## Tables Updated

### roles, permissions, role_permissions (020)

RLS enabled. Open SELECT for `authenticated`. No write policies for
`authenticated` — writes are service_role-only (supabaseAdmin). Tables contain
RBAC v2 catalog data that the permission management UI reads directly.

### rt_permission_overrides (020)

RLS enabled. All four commands (SELECT, INSERT, UPDATE, DELETE) scoped to
`has_permission(rt_id, 'permission.override')`. This is the highest-sensitivity
RBAC table: contains per-RT permission customizations. `has_permission()` is
SECURITY DEFINER and bypasses RLS on this table internally — no circular
dependency.

### memberships (021)

Three new permissive policies added alongside existing `super_admin` policies:

| Policy | Command | Guard |
|---|---|---|
| `memberships: rt admin insert` | INSERT | `has_permission(rt_id, 'membership.create')` |
| `memberships: rt admin update` | UPDATE | `has_permission(rt_id, 'membership.update')` |
| `memberships: rt admin delete` | DELETE | `has_permission(rt_id, 'membership.delete')` |

RT_ADMIN and RT_CHAIR can now manage memberships via the authenticated client
in addition to the existing supabaseAdmin path.

### activity_logs (022)

SELECT policy `activity_logs: read own rt` altered:

| | Before | After |
|---|---|---|
| Guard | `rt_id IN (get_user_rt_ids()) OR is_super_admin()` | `has_permission(rt_id, 'audit.view')` |

Effect: activity log reads are now restricted to RT_ADMIN (the only role with
`audit.view` in the default seed) and SUPER_ADMIN. The INSERT policy is unchanged.

### rt (023)

UPDATE policy `rt: members can update own rt` altered:

| | Before | After |
|---|---|---|
| Guard | `id IN (get_user_rt_ids()) OR is_super_admin()` | `has_permission(id, 'settings.update')` |

Effect: RT profile updates now require `settings.update` permission. RT_ADMIN
and RT_CHAIR retain access; TREASURER, SECRETARY, and RESIDENT lose direct
update access.

### ledger (024)

INSERT policy `ledger: create` dropped. The policy used `ledger.view` as the
INSERT guard (semantically incorrect). Since `insert_ledger()` is SECURITY
DEFINER (bypasses RLS) and is the only legitimate INSERT path, no authenticated
INSERT policy is needed or appropriate.

### notifications (025)

INSERT policy `notifications: authenticated can insert` altered:

| | Before | After |
|---|---|---|
| WITH CHECK | `true` | `target_user_id = auth.uid() OR is_super_admin()` |

Prevents cross-user notification spam. All server-side notification inserts
use supabaseAdmin (service_role) and are unaffected.

## Deferred

### storage.objects (026)

Storage tenant isolation is deferred pending a path naming convention audit.
See `supabase/migrations/026_rbac_storage_tenant_isolation.sql` for prerequisites.