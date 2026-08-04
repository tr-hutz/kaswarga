# PERMISSION_MATRIX.md

> Project: KasWarga

Version: 2.0 (RBAC v2)

---

# Purpose

This document defines the authorization model used throughout KasWarga.

KasWarga implements Role-Based Access Control (RBAC) with configurable RT-level permission overrides.

This document is the single source of truth for authorization.

Any permission changes must be reflected here before implementation.

---

# Authorization Model

KasWarga uses the following authorization flow.

```
User
    │
    ▼
Role
    │
    ▼
Default Role Permissions
    │
    ▼
RT Permission Overrides
    │
    ▼
Effective Permissions
    │
    ▼
Business Rules
```

Roles determine the default permissions.

Each RT may override selected permissions without creating new roles.

Permissions are never assigned directly to individual users.

---

# Permission Naming Convention

Permission codes follow the format:

```
module.action
```

Examples:

```
resident.view
resident.create
resident.update
resident.delete
resident.approve

payment.submit
payment.approve
payment.reject

expense.create
expense.delete

ledger.view
ledger.adjustment
ledger.export
```

Permission codes must remain stable because they are referenced by:

- Backend
- Middleware
- PermissionService
- Navigation
- API
- Playwright
- RLS Policies

---

# System Roles

KasWarga defines the following system roles.

| Role | Description |
|------|-------------|
| Super Administrator | Global system administrator |
| RT Chair | Head of an RT |
| RT Administrator | RT administrator |
| Treasurer | RT treasurer |
| Resident | Registered resident |

Roles are fixed.

Permissions are configurable.

---

# Permission Resolution

Permissions are resolved in the following order.

1. System Role
2. Default Role Permissions
3. RT Permission Overrides
4. Effective Permissions

If an RT override exists, it replaces the default permission.

Otherwise, the default permission is used.

---

# Default Permission Matrix

Legend

| Symbol | Meaning |
|---------|----------|
| ✅ | Allowed |
| ❌ | Not Allowed |
| 👁 | Read Only |
| ⚡ | Own Data Only |

---

## RT

| Permission | Super | Chair | Admin | Treasurer | Resident |
|------------|--------|--------|--------|------------|-----------|
| rt.create | ✅ | ❌ | ❌ | ❌ | ❌ |
| rt.approve | ✅ | ❌ | ❌ | ❌ | ❌ |
| rt.archive | ✅ | ❌ | ❌ | ❌ | ❌ |
| rt.update | 👁 | ✅ | ✅ | ❌ | ❌ |

---

## Resident

| Permission | Super | Chair | Admin | Treasurer | Resident |
|------------|--------|--------|--------|------------|-----------|
| resident.view | ❌ | ✅ | ✅ | 👁 | ⚡ |
| resident.create | ❌ | ✅ | ✅ | ❌ | ❌ |
| resident.update | ❌ | ✅ | ✅ | ❌ | ❌ |
| resident.delete | ❌ | ✅ | ✅ | ❌ | ❌ |
| resident.approve | ❌ | ✅ | ✅ | ❌ | ❌ |
| resident.reject | ❌ | ✅ | ✅ | ❌ | ❌ |
| resident.export | ❌ | ❌ | ✅ | ❌ | ❌ |
| resident.import | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## Resident Registration

| Permission | Super | Chair | Admin | Treasurer | Resident |
|------------|--------|--------|--------|------------|-----------|
| registration.submit | ❌ | ❌ | ❌ | ❌ | ✅ |
| registration.approve | ❌ | ✅ | ✅ | ❌ | ❌ |
| registration.reject | ❌ | ✅ | ✅ | ❌ | ❌ |

---

## Payment

| Permission | Super | Chair | Admin | Treasurer | Resident |
|------------|--------|--------|--------|------------|-----------|
| payment.view | ❌ | 👁 | 👁 | ✅ | ⚡ |
| payment.create | ❌ | ✅ | ✅ | ✅ | ✅ |
| payment.update | ❌ | ❌ | ✅ | ✅ | ❌ |
| payment.delete | ❌ | ❌ | ✅ | ✅ | ❌ |
| payment.approve | ❌ | ❌ | ✅ | ✅ | ❌ |
| payment.reject | ❌ | ❌ | ✅ | ✅ | ❌ |
| dashboard.payment.export | ❌ | ❌ | ✅ | ✅ | ❌ |

> `dashboard.payment.export` is also granted to Secretary.

---

## Expense

| Permission | Super | Chair | Admin | Treasurer | Resident |
|------------|--------|--------|--------|------------|-----------|
| expense.view | ❌ | 👁 | 👁 | ✅ | 👁 |
| expense.create | ❌ | ❌ | ❌ | ✅ | ❌ |
| expense.update | ❌ | ❌ | ❌ | ✅ | ❌ |
| expense.delete | ❌ | ❌ | ❌ | ✅ | ❌ |
| expense.approve | ❌ | ✅ | ❌ | ❌ | ❌ |
| expense.reject | ❌ | ✅ | ❌ | ❌ | ❌ |
| expense.export | ❌ | ❌ | ❌ | ✅ | ❌ |
| expense.import | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## Ledger

| Permission | Super | Chair | Admin | Treasurer | Resident |
|------------|--------|--------|--------|------------|-----------|
| ledger.view | ❌ | 👁 | 👁 | ✅ | 👁 |
| ledger.adjustment | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## Dashboard

| Permission | Super | Chair | Admin | Treasurer | Resident |
|------------|--------|--------|--------|------------|-----------|
| dashboard.view | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Notification

| Permission | Super | Chair | Admin | Treasurer | Resident |
|------------|--------|--------|--------|------------|-----------|
| notification.view | ✅ | ✅ | ✅ | ✅ | ✅ |
| notification.mark-read | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## User

| Permission | Super | Chair | Admin | Treasurer | Resident |
|------------|--------|--------|--------|------------|-----------|
| user.create | ✅ | ❌ | ✅ | ❌ | ❌ |
| user.update | ✅ | ❌ | ✅ | ❌ | ⚡ |
| user.disable | ✅ | ❌ | ✅ | ❌ | ❌ |
| user.reset-password | ✅ | ❌ | ✅ | ❌ | ⚡ |

---

# RT Permission Override

Each RT may override selected permissions.

Example:

Default:

```
Treasurer

resident.create = false
```

RT 05 Override:

```
Treasurer

resident.create = true
```

Effective Permission:

```
Treasurer in RT 05

resident.create = true
```

No new role is created.

Only the permission changes.

---

# Authorization Rules

Business modules must never compare role names directly.

Forbidden

```ts
if (role === "TREASURER");
```

Required

```ts
permissionService.hasPermission(
    userId,
    "payment.approve"
)
```

---

# Security Principles

1. Least Privilege Principle.
2. Permissions are inherited from Roles.
3. RT may override default permissions.
4. UI visibility never replaces backend authorization.
5. Authorization is enforced server-side.
6. RLS remains the final data protection layer.
7. Every permission change must be auditable.

---

# Future Extensions

RBAC v2 is designed to support:

- Permission Profiles
- Organization Templates
- Apartment / Housing Profiles
- Multi-Organization Deployment

without changing the authorization architecture.

---

End of Document