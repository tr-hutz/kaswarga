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