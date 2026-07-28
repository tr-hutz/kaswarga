# SQL_MIGRATION_PLAN.md

> Project: KasWarga
>
> Version: 2.0 (RBAC v2)

---

# Purpose

This document defines the database migration strategy required to introduce RBAC v2 into KasWarga.

It specifies the migration sequence, dependencies, validation strategy, and rollback considerations.

This document intentionally does **not** contain SQL scripts.

SQL implementation belongs to the migration files.

---

# Migration Goals

RBAC v2 introduces:

- Permission Catalog
- Role Permissions
- RT-specific Permission Overrides
- AuthorizationContext support
- Permission-based RLS

The migration must preserve all existing production data.

No existing user data should be lost.

---

# Migration Principles

The migration must satisfy the following principles.

- Forward compatible
- Backward compatible during deployment
- Idempotent
- Transaction-safe
- Rollback-aware

---

# Migration Sequence

The recommended execution order is:

```
001_create_roles

↓

002_create_permissions

↓

003_create_role_permissions

↓

004_create_permission_overrides

↓

005_create_authorization_functions

↓

006_update_rls_policies

↓

007_seed_default_permissions

↓

008_seed_default_role_permissions

↓

009_validation
```

---

# Phase 1 — Create Core RBAC Tables

Create:

- roles
- permissions
- role_permissions
- permission_overrides

No existing tables should be modified during this phase.

---

# Phase 2 — Authorization Functions

Create PostgreSQL helper functions.

Examples:

- has_permission(...)
- current_membership(...)
- current_neighborhood(...)

These functions will be reused by RLS.

---

# Phase 3 — RLS Migration

Replace role-based policies.

Old

```
role == Treasurer
```

New

```
has_permission(
'payment.approve'
)
```

Every protected table should migrate independently.

---

# Phase 4 — Seed Data

Insert:

Default Roles

↓

Permissions

↓

Role Permissions

Permission Overrides are intentionally NOT seeded.

---

# Phase 5 — Validation

Verify:

✓ Roles created

✓ Permissions created

✓ Role mappings created

✓ Existing memberships remain valid

✓ Existing users unaffected

✓ Existing residents unaffected

✓ Existing ledger preserved

---

# Existing Data Preservation

The migration must preserve:

- Users
- Memberships
- Residents
- Payments
- Expenses
- Ledger
- Reports
- Audit Logs

No production data should require migration outside RBAC.

---

# Rollback Strategy

Rollback should remove only RBAC v2 objects.

Rollback must never remove:

- Users
- Residents
- Financial records
- Ledger
- Reports

---

# Deployment Strategy

Recommended deployment order.

```
Database Migration

↓

Seeder

↓

Application Deployment

↓

Smoke Test

↓

Production Validation
```

---

# Smoke Test

Verify:

- Login

- Resident module

- Payment module

- Expense module

- Ledger

- Reports

- Permission Override

- RLS

---

# Production Validation

Before enabling production traffic verify:

✓ AuthorizationContext generated

✓ PermissionService operational

✓ RLS active

✓ Seeder completed

✓ No orphan Role

✓ No orphan Permission

✓ No orphan Membership

---

# Migration Risks

Potential risks include:

- Incorrect permission mapping
- Incomplete seed data
- Missing RLS updates
- Orphan permissions
- Incorrect overrides

All risks should be validated before production rollout.

---

# References

This migration plan depends on:

- PERMISSION_CATALOG.md
- DEFAULT_ROLE_MATRIX.md
- DATABASE_SCHEMA.md
- RLS_POLICY.md