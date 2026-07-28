# PLAYWRIGHT_AUTHORIZATION.md

> Project: KasWarga
>
> Version: 2.0 (RBAC v2)

---

# Purpose

This document defines the authorization testing strategy for KasWarga.

The objective is to ensure that every permission is automatically verified before deployment.

Authorization testing is mandatory for every protected feature.

---

# Testing Goals

Authorization tests verify:

- UI visibility
- Navigation visibility
- Route protection
- Server Actions
- API endpoints
- Business Services
- PostgreSQL RLS

All authorization layers must produce consistent results.

---

# Authorization Matrix

Every permission should be tested.

Example

| Permission | Expected Result |
|------------|-----------------|
| resident.view | Allow |
| resident.create | Allow / Deny |
| resident.update | Allow / Deny |
| resident.delete | Allow / Deny |
| payment.view | Allow / Deny |
| payment.create | Allow / Deny |
| payment.approve | Allow / Deny |
| payment.reject | Allow / Deny |
| expense.view | Allow / Deny |
| expense.create | Allow / Deny |
| expense.update | Allow / Deny |
| expense.delete | Allow / Deny |
| ledger.view | Allow / Deny |
| report.view | Allow / Deny |
| report.export | Allow / Deny |

---

# Test Layers

Authorization must be verified at multiple layers.

```
UI

↓

Navigation

↓

Server Action

↓

Business Service

↓

PostgreSQL RLS
```

Passing only UI tests is insufficient.

---

# Navigation Tests

Verify

- Menu visible
- Menu hidden
- Nested menu visibility
- Breadcrumb visibility
- Search visibility

---

# Component Tests

Verify

- Button visible
- Button hidden
- Disabled state
- Read-only state

Examples

Approve Button

Reject Button

Delete Button

Export Button

---

# Route Tests

Verify

Anonymous User

↓

Redirect to Login

Authenticated User

↓

Allowed

Unauthorized User

↓

403 Forbidden

---

# Server Action Tests

Verify

- Authentication required
- Authorization required
- Invalid payload
- Valid payload
- Duplicate request
- Idempotent behavior

---

# API Tests

Verify

- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 422 Validation Error
- 500 Internal Error

Every protected endpoint must be covered.

---

# Business Service Tests

Verify

Business Services reject unauthorized RequestContext.

Example

```
Resident

↓

Approve Payment

↓

Forbidden
```

Authorization must never depend on UI.

---

# PostgreSQL RLS Tests

Verify

User bypassing Business Service

↓

Direct SQL

↓

Denied

RLS must enforce the same authorization rules.

---

# Permission Override Tests

Verify

Default Role

↓

Permission Granted

RT Override

↓

Permission Removed

Result

↓

Denied

And vice versa.

---

# Regression Tests

Every authorization bug must produce a regression test.

Example

Bug

Resident approved payment.

↓

Add Playwright Test

↓

Never regress again.

Regression tests must never be removed.

---

# Test Data

Authorization tests should use dedicated fixtures.

Recommended fixtures

- Administrator
- Chairman
- Treasurer
- Secretary
- Resident
- Guest

Each fixture should represent realistic permission combinations.

---

# Test Isolation

Every test must:

- Create its own data
- Avoid shared mutable state
- Clean up after execution

Tests must be deterministic.

---

# Naming Convention

Recommended format

```
[Module] [Permission] [Expected Result]
```

Examples

```
Resident can view resident list

Treasurer can approve payment

Resident cannot approve payment

Secretary cannot delete resident

Chairman can manage expenses
```

---

# Release Gate

A release must not proceed if:

- Any authorization test fails
- Any RLS test fails
- Any permission override test fails
- Any regression test fails

Authorization failures are release blockers.

---

# Coverage

Every protected feature must include:

✓ UI Test

✓ Navigation Test

✓ Server Action Test

✓ Business Service Test

✓ PostgreSQL RLS Test

---

# Performance

Authorization tests should execute independently.

Slow tests should be minimized.

Fixtures should be reusable.

---

# CI/CD

Authorization tests must execute automatically during CI.

Recommended pipeline

```
Lint

↓

Unit Test

↓

Integration Test

↓

Authorization Test

↓

Playwright

↓

Build

↓

Deploy Preview

↓

Smoke Test

↓

Production
```

Deployment must stop if authorization tests fail.

---

# Security Principles

Authorization testing is mandatory.

Visual hiding is not sufficient.

Server-side authorization must always be verified.

Every permission must be tested.

Every authorization bug becomes a permanent regression test.

---

# Architecture Decision

KasWarga follows a Defense in Depth testing strategy.

Authorization correctness is validated at:

- UI Layer
- Navigation Layer
- Server Actions
- Business Services
- PostgreSQL RLS

A permission is considered secure only when all applicable layers pass.