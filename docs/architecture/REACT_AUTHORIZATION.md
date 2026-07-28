# REACT_AUTHORIZATION.md

> Project: KasWarga
>
> Version: 2.0 (RBAC v2)

---

# Purpose

This document defines how React components consume authorization information.

React components never perform authorization directly.

They consume authorization state provided by RequestContext through dedicated React Hooks.

---

# Principles

UI visibility is not authorization.

Showing or hiding UI elements never grants access.

Actual authorization always occurs inside Business Services and PostgreSQL RLS.

---

# Architecture

```
RequestContext

↓

AuthorizationContext

↓

React Authorization Provider

↓

React Hooks

↓

UI Components
```

---

# React Provider

The application exposes AuthorizationContext through a React Provider.

```
<App>

↓

AuthorizationProvider

↓

Children
```

The provider receives only safe authorization data.

Sensitive information must never be exposed.

---

# React Hooks

The application exposes reusable hooks.

Recommended hooks

```ts
usePermission()

usePermissions()

useCan()

useCurrentUser()
```

Hooks never access the database.

---

# usePermission()

Checks one permission.

```ts
const canApprove =
    usePermission(
        "payment.approve"
    );
```

Returns

```ts
boolean
```

---

# usePermissions()

Checks multiple permissions.

```ts
const permissions =
    usePermissions([
        "payment.create",
        "payment.update"
    ]);
```

Returns

```ts
Map<string, boolean>
```

---

# useCan()

Convenience helper.

```ts
const canCreate =
    useCan(
        "resident.create"
    );
```

Equivalent to

```ts
usePermission(...)
```

---

# Conditional Rendering

Correct

```tsx
{canApprove && (
    <ApproveButton />
)}
```

Incorrect

```tsx
if(role==="TREASURER")
```

UI must never compare role names.

---

# Disabled vs Hidden

Recommended

Permission unavailable

↓

Hide action button

Business rule unavailable

↓

Disable action button

Example

Payment already approved

↓

Button visible

↓

Disabled

Permission denied

↓

Button hidden

---

# Forms

Form visibility

↓

Permission

Form validation

↓

Business Rules

Form submission

↓

Server Action

---

# Navigation

Navigation must depend on permissions.

Correct

```
Expense

↓

expense.view
```

Forbidden

```
Treasurer

↓

Expense Menu
```

---

# Data Fetching

React components never load permissions.

Permissions come only from AuthorizationProvider.

---

# Error Handling

Permission denied

↓

Hide component

Unexpected error

↓

Fallback UI

---

# Testing

Every protected component should be tested.

Examples

✓ Button visible

✓ Button hidden

✓ Disabled state

✓ Loading state

✓ Permission change

---

# Security

React is responsible only for presentation.

Authorization remains server-side.

Never trust client-side authorization.

---

# Design Principles

React components are dumb.

Hooks expose authorization.

AuthorizationProvider distributes authorization.

Business Services enforce authorization.

PostgreSQL RLS guarantees authorization.