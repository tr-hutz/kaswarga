# MIGRATION_CHECKLIST.md

> Project: KasWarga
>
> Version: 2.0 (RBAC v2)

---

# Purpose

This document tracks the implementation progress of RBAC v2.

Unlike SQL_MIGRATION_PLAN, this document focuses on execution status rather than migration design.

Each task should be completed in sequence.

No implementation should skip unfinished dependencies.

---

# Overall Progress

| Phase | Status |
|---------|---------|
| Documentation | ✅ Complete |
| Database Migration | ☐ Pending |
| Permission Seeder | ☐ Pending |
| Backend Authorization | ☐ Pending |
| Frontend Authorization | ☐ Pending |
| RLS Migration | ☐ Pending |
| Testing | ☐ Pending |
| Production Validation | ☐ Pending |

---

# Phase 1 — Database

## Roles

- [ ] Create roles table
- [ ] Verify primary key
- [ ] Verify unique code
- [ ] Verify indexes

---

## Permissions

- [ ] Create permissions table
- [ ] Seed Permission Catalog
- [ ] Verify uniqueness

---

## Role Permissions

- [ ] Create junction table
- [ ] Add indexes
- [ ] Verify FK

---

## Permission Overrides

- [ ] Create table
- [ ] Verify neighborhood FK
- [ ] Verify role FK
- [ ] Verify permission FK

---

# Phase 2 — PostgreSQL

## Functions

- [ ] has_permission()

- [ ] current_membership()

- [ ] current_neighborhood()

---

## RLS

- [ ] Residents

- [ ] Payments

- [ ] Expenses

- [ ] Ledger

- [ ] Reports

---

# Phase 3 — Seeder

## Default Roles

- [ ] Administrator

- [ ] Ketua

- [ ] Bendahara

- [ ] Sekretaris

- [ ] Warga

---

## Permission Seeder

- [ ] Import Permission Catalog

---

## Role Permission Seeder

- [ ] Administrator

- [ ] Ketua

- [ ] Bendahara

- [ ] Sekretaris

- [ ] Warga

---

# Phase 4 — Backend

## PermissionService

- [ ] Build PermissionService

- [ ] Cache permissions

- [ ] Unit Test

---

## AuthorizationContext

- [ ] Build AuthorizationContext

- [ ] Immutable

- [ ] Unit Test

---

## RequestContext

- [ ] Inject AuthorizationContext

- [ ] Unit Test

---

## Middleware

- [ ] Authentication

- [ ] Membership

- [ ] AuthorizationContext

---

## Business Services

- [ ] Resident

- [ ] Payment

- [ ] Expense

- [ ] Ledger

- [ ] Report

---

# Phase 5 — Frontend

## Navigation

- [ ] Sidebar

- [ ] Breadcrumb

- [ ] Hidden Menu

---

## Components

- [ ] Buttons

- [ ] Forms

- [ ] Drawer

- [ ] Modal

---

## React

- [ ] usePermission()

- [ ] useAuthorization()

---

# Phase 6 — Testing

## Unit Test

- [ ] PermissionService

- [ ] AuthorizationContext

---

## Playwright

- [ ] Resident

- [ ] Payment

- [ ] Expense

- [ ] Report

- [ ] Ledger

---

## Regression

- [ ] Permission Override

- [ ] Cross RT

- [ ] Self Approval

---

# Phase 7 — Production Validation

- [ ] Migration successful

- [ ] Seeder completed

- [ ] RLS enabled

- [ ] Smoke Test

- [ ] UAT

- [ ] Production Deployment

---

# Completion Criteria

RBAC v2 is considered complete only when:

- Every checklist item is completed.
- No critical authorization issue remains.
- Playwright passes.
- RLS passes.
- Production validation passes.

---

# References

- SQL_MIGRATION_PLAN.md
- PERMISSION_CATALOG.md
- DEFAULT_ROLE_MATRIX.md
- AUTHORIZATION_ARCHITECTURE.md
- RLS_POLICY.md