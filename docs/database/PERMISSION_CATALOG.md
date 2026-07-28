# PERMISSION_CATALOG.md

> Project: KasWarga
>
> Version: 2.0 (RBAC v2)

---

# Purpose

This document defines the complete permission catalog used by KasWarga.

Permission codes are immutable identifiers representing executable capabilities within the application.

This document is the **Single Source of Truth (SSOT)** for authorization.

All permission checks throughout the application must reference this catalog.

---

# Naming Convention

Permission names follow the format:

```
<module>.<action>
```

Examples:

```
resident.view
resident.create
payment.approve
expense.delete
```

Permission names:

- lowercase only
- dot-separated
- immutable
- framework independent

---

# Permission Lifecycle

Every permission follows this lifecycle.

```
Defined

↓

Assigned to Role

↓

(Optional)
Permission Override

↓

Effective Permission

↓

AuthorizationContext

↓

Business Service

↓

PostgreSQL RLS
```

---

# Resident Module

| Permission | Description | Status | Notes |
|------------|-------------|--------|-------|
| resident.view | View resident list | Active | |
| resident.create | Create resident | Active | |
| resident.update | Update resident information | Active | |
| resident.delete | Delete resident | Active | Soft Delete only |
| resident.approve | Approve resident registration | Active | |
| resident.reject | Reject resident registration | Active | |

---

# Membership Module

| Permission | Description | Status | Notes |
|------------|-------------|--------|-------|
| membership.view | View memberships | Active | |
| membership.create | Add membership | Active | |
| membership.update | Update membership | Active | |
| membership.delete | Remove membership | Active | |

---

# Payment Module

| Permission | Description | Status | Notes |
|------------|-------------|--------|-------|
| payment.view | View payments | Active | |
| payment.create | Record payment | Active | |
| payment.update | Edit payment | Active | |
| payment.delete | Delete payment | Active | Soft Delete only |
| payment.approve | Approve payment | Active | |
| payment.reject | Reject payment | Active | |

---

# Expense Module

| Permission | Description | Status | Notes |
|------------|-------------|--------|-------|
| expense.view | View expenses | Active | |
| expense.create | Create expense | Active | |
| expense.update | Edit expense | Active | |
| expense.delete | Delete expense | Active | Soft Delete only |

---

# Ledger Module

| Permission | Description | Status | Notes |
|------------|-------------|--------|-------|
| ledger.view | View ledger | Active | |
| ledger.export | Export ledger | Active | |

---

# Report Module

| Permission | Description | Status | Notes |
|------------|-------------|--------|-------|
| report.view | View reports | Active | |
| report.export | Export reports | Active | |

---

# Announcement Module

| Permission | Description | Status | Notes |
|------------|-------------|--------|-------|
| announcement.view | View announcements | Active | |
| announcement.create | Create announcement | Active | |
| announcement.update | Update announcement | Active | |
| announcement.delete | Delete announcement | Active | |

---

# Event Module

| Permission | Description | Status | Notes |
|------------|-------------|--------|-------|
| event.view | View events | Active | |
| event.create | Create event | Active | |
| event.update | Update event | Active | |
| event.delete | Delete event | Active | |

---

# Document Module

| Permission | Description | Status | Notes |
|------------|-------------|--------|-------|
| document.view | View shared documents | Active | |
| document.create | Upload document | Active | |
| document.update | Update document | Active | |
| document.delete | Delete document | Active | |

---

# Settings Module

| Permission | Description | Status | Notes |
|------------|-------------|--------|-------|
| settings.view | View RT settings | Active | |
| settings.update | Update RT settings | Active | |

---

# User Management Module

| Permission | Description | Status | Notes |
|------------|-------------|--------|-------|
| user.view | View users | Active | |
| user.create | Create user | Active | |
| user.update | Update user | Active | |
| user.delete | Delete user | Active | |

---

# Role Management Module

| Permission | Description | Status | Notes |
|------------|-------------|--------|-------|
| role.view | View roles | Active | |
| role.update | Update role metadata | Active | System only |

---

# Permission Management Module

| Permission | Description | Status | Notes |
|------------|-------------|--------|-------|
| permission.view | View permissions | Active | |
| permission.override | Manage RT permission overrides | Active | RBAC v2 |

---

# Audit Module

| Permission | Description | Status | Notes |
|------------|-------------|--------|-------|
| audit.view | View audit logs | Active | |

---

# Authorization Rules

Permissions are evaluated by:

```
PermissionService

↓

AuthorizationContext

↓

Business Services

↓

PostgreSQL RLS
```

Permissions are never evaluated directly inside:

- React Components
- Route Handlers
- Repositories

---

# Deprecation Policy

Permission identifiers are immutable.

Existing permission codes must never be renamed.

If functionality changes:

- Create a new permission.
- Mark the previous permission as Deprecated.
- Remove only after migration.

---

# Future Expansion

New modules must define permissions before implementation begins.

Permission Catalog must always be updated before:

- SQL Migration
- Seeder
- Business Services
- UI
- Playwright
- PostgreSQL RLS

---

# Architecture References

This document is referenced by:

- BUSINESS_RULES.md
- DATABASE_SCHEMA.md
- AUTHORIZATION_ARCHITECTURE.md
- PERMISSION_SERVICE.md
- AUTHORIZATION_PIPELINE.md
- REQUEST_CONTEXT.md
- API_SECURITY.md
- RLS_POLICY.md
- PLAYWRIGHT_AUTHORIZATION.md