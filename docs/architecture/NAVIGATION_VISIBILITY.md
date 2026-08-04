# NAVIGATION_VISIBILITY.md

> Project: KasWarga
>
> Version: 2.0 (RBAC v2)

---

# Purpose

This document defines how application navigation is rendered.

Navigation is permission-driven.

Navigation must never depend on Role names.

---

# Design Goals

Navigation should provide:

- Consistent menu visibility
- Permission-based rendering
- Zero role comparison
- Centralized configuration
- Easy extensibility

---

# Architecture

```
AuthorizationContext

↓

React Authorization Hooks

↓

Navigation Configuration

↓

Rendered Sidebar
```

Navigation never queries the database.

---

# Navigation Principle

Each navigation item declares its required permission.

Example

```
Residents

↓

resident.view
```

```
Payments

↓

payment.view
```

```
Expenses

↓

expense.view
```

```
Reports

↓

report.view
```

The sidebar renders only items the current user is allowed to access.

---

# Navigation Configuration

Navigation should be configuration-driven.

Example

```ts
interface NavigationItem {

    id: string;

    title: string;

    icon: ReactNode;

    href: string;

    requiredPermission?: string;

    children?: NavigationItem[];

}
```

Example

```ts
{
    id: "payments",
    title: "Pembayaran",
    href: "/payments",
    requiredPermission: "payment.view"
}
```

---

# Rendering Flow

```
Navigation Configuration

↓

requiredPermission

↓

usePermission()

↓

Visible

or

Hidden
```

---

# RT-Scoped Navigation

Some navigation items are only meaningful within the context of an RT (neighborhood).
They use two additional flags in the navigation configuration:

| Flag          | Behaviour                                                            |
|---------------|----------------------------------------------------------------------|
| `requiresRt`  | Visible only when the user has an active RT membership (`rtId` is set). Hidden from SUPER_ADMIN (no RT). |
| `noRt`        | Visible only when the user has **no** RT (i.e. SUPER_ADMIN platform pages). Hidden from RT members. |

## Examples

**RT-only items** (hidden from SUPER_ADMIN)

```
Override Izin Anggota   →  requiresRt: true  →  permission.override
Lihat Izin Efektif      →  requiresRt: true  →  permission.view
Inspektur Izin          →  requiresRt: true  →  rbac.inspector.view
Roles                   →  requiresRt: true  →  role.view
```

**SUPER_ADMIN-only items** (hidden from RT members)

```
RT Management           →  noRt: true  →  user.view
RT Registration         →  noRt: true  →  user.view
User Management         →  noRt: true  →  user.view
```

## Rationale

SUPER_ADMIN is a platform-level role with no RT membership.
RT management menus (RBAC overrides, effective permission viewer, inspector) are scoped to a specific RT.
Showing them to SUPER_ADMIN would be misleading — the API enforces the RT scope and returns empty data.

The `requiresRt` flag prevents navigation confusion before the API is reached.

---

# Nested Navigation

Parent menus should be visible only when at least one child is accessible.

Example

```
Finance

├── Payments
├── Expenses
└── Ledger
```

If all child permissions are denied

↓

Hide Finance menu.

---

# Hidden vs Disabled

Permission denied

↓

Hide menu.

Business condition unavailable

↓

Disable action inside page.

Navigation should not expose inaccessible features.

---

# Dashboard Widgets

Widgets follow the same rule.

```
Widget

↓

Permission

↓

Visible
```

Dashboard widgets must never compare role names.

---

# Breadcrumb

Breadcrumbs should be generated only from visible navigation items.

Hidden menus must not appear in breadcrumbs.

---

# Search

Global navigation search must return only accessible pages.

Users must never discover inaccessible pages through search.

---

# Deep Links

Navigation visibility is not authorization.

Example

User enters

```
/payments
```

directly.

↓

Business Layer

↓

AuthorizationContext

↓

403 if permission is denied.

---

# Dynamic Menu

Future versions may load navigation dynamically.

Possible sources

- Static Configuration
- Feature Flags
- Tenant Configuration

Permission rules remain identical.

---

# Testing

Navigation tests should verify

- Menu visible
- Menu hidden
- Nested menu visibility
- Breadcrumb visibility
- Search visibility
- Permission updates

---

# Security

Navigation improves usability.

Navigation does not provide security.

Business Services and PostgreSQL RLS remain the authorization source of truth.

---

# Design Principles

Navigation is:

- Configuration-driven
- Permission-driven
- Stateless
- Independent of Roles

Role names must never appear inside navigation configuration.

Permissions are the only navigation contract.