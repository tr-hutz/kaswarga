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

payment.create
payment.approve
payment.reject

expense.create
expense.delete

ledger.view
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

| Role | Code | Description |
|------|------|-------------|
| Super Administrator | SUPER_ADMIN | Global platform administrator. Bypasses the permission system entirely. |
| RT Chair | RT_CHAIR | Head of an RT |
| RT Administrator | RT_ADMIN | RT administrator |
| Treasurer | TREASURER | RT treasurer |
| Secretary | SECRETARY | RT secretary |
| Resident | RESIDENT | Registered resident |

Roles are fixed.

Permissions are configurable per RT.

> **Super Admin note:** SUPER_ADMIN does not have entries in `role_permissions`.
> Access is enforced unconditionally by `SuperAdminPermissionSet` in the application layer
> and by the `is_super_admin()` guard in database functions.
> The ❌ shown for Super Admin below indicates that those features are
> RT-scoped and not relevant to platform administration.

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

## Resident

| Permission | Super | Chair | Admin | Treasurer | Secretary | Resident |
|------------|-------|-------|-------|-----------|-----------|---------|
| resident.view | ❌ | ✅ | ✅ | 👁 | 👁 | ⚡ |
| resident.create | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| resident.update | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| resident.delete | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| resident.approve | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| resident.reject | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| resident.export | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| resident.import | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## Membership

| Permission | Super | Chair | Admin | Treasurer | Secretary | Resident |
|------------|-------|-------|-------|-----------|-----------|---------|
| membership.view | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| membership.create | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| membership.update | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| membership.delete | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## Payment

| Permission | Super | Chair | Admin | Treasurer | Secretary | Resident |
|------------|-------|-------|-------|-----------|-----------|---------|
| payment.view | ❌ | 👁 | 👁 | ✅ | 👁 | ⚡ |
| payment.create | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| payment.update | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| payment.delete | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| payment.approve | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| payment.reject | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| dashboard.payment.export | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| dashboard.payment.arrears | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## Expense

| Permission | Super | Chair | Admin | Treasurer | Secretary | Resident |
|------------|-------|-------|-------|-----------|-----------|---------|
| expense.view | ❌ | 👁 | 👁 | ✅ | 👁 | 👁 |
| expense.create | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| expense.update | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| expense.delete | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| expense.approve | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| expense.reject | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| expense.export | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| expense.import | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## Income

| Permission | Super | Chair | Admin | Treasurer | Secretary | Resident |
|------------|-------|-------|-------|-----------|-----------|---------|
| income.view    | ❌ | 👁 | ✅ | ✅ | 👁 | ❌ |
| income.create  | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| income.update  | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| income.delete  | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| income.approve | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| income.reject  | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| income.export  | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| income.import  | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |

---

## Ledger

| Permission | Super | Chair | Admin | Treasurer | Secretary | Resident |
|------------|-------|-------|-------|-----------|-----------|---------|
| ledger.view | ❌ | 👁 | 👁 | ✅ | ❌ | 👁 |
| ledger.export | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## Report

| Permission | Super | Chair | Admin | Treasurer | Secretary | Resident |
|------------|-------|-------|-------|-----------|-----------|---------|
| report.view | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| report.export | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## Settings

| Permission | Super | Chair | Admin | Treasurer | Secretary | Resident |
|------------|-------|-------|-------|-----------|-----------|---------|
| settings.view | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| settings.update | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## User Management

| Permission | Super | Chair | Admin | Treasurer | Secretary | Resident |
|------------|-------|-------|-------|-----------|-----------|---------|
| user.view | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| user.create | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| user.update | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| user.delete | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## Role Management

| Permission | Super | Chair | Admin | Treasurer | Secretary | Resident |
|------------|-------|-------|-------|-----------|-----------|---------|
| role.view | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| role.create | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| role.update | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

> Role management is RT-scoped. Super Admin manages roles at the platform level through direct database administration, not through the RT role management UI.

---

## Permission Management

| Permission | Super | Chair | Admin | Treasurer | Secretary | Resident |
|------------|-------|-------|-------|-----------|-----------|---------|
| permission.view | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| permission.update | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| permission.override | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## Audit

| Permission | Super | Chair | Admin | Treasurer | Secretary | Resident |
|------------|-------|-------|-------|-----------|-----------|---------|
| audit.view | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## RT Management

> RT Management is a Super Admin platform-level feature, not controlled through `role_permissions`.

| Feature | Super | Chair | Admin | Treasurer | Secretary | Resident |
|---------|-------|-------|-------|-----------|-----------|---------|
| View RT list | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve RT registration | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Archive RT | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Update RT profile | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

# Navigation Visibility by Role

| Menu | Super | Chair | Admin | Treasurer | Secretary | Resident |
|------|-------|-------|-------|-----------|-----------|---------|
| Kelola RT | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Pendaftaran RT | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Kelola Pengguna | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Beranda | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dasbor | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Warga | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pembayaran | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pengeluaran | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Buku Kas | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Notifikasi | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Aktivitas | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Profil RT | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manajemen Peran | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Matriks Akses | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Override Akses | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Lihat Izin Efektif | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Inspeksi Izin | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Ganti Kata Kunci | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

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
