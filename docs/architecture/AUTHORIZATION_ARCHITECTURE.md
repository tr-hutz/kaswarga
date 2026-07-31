# AUTHORIZATION_ARCHITECTURE.md

> Project: KasWarga
>
> Version: 2.0 (RBAC v2)

---

# Purpose

This document defines the authorization architecture of KasWarga.

It explains how authorization information is constructed, propagated, and enforced across the application.

This document is the single source of truth for authorization.

---

# Goals

RBAC v2 is designed to provide:

- Configurable authorization per RT
- Consistent authorization across UI, API, Server Actions, and Database
- Centralized permission evaluation
- Zero authorization logic inside UI components
- Least Privilege Principle
- Auditability
- Future multi-tenant support

---

# Core Principle

Every request constructs exactly one Authorization Context.

All authorization decisions must use this context.

Business modules must never resolve permissions themselves.

---

# Authorization Architecture

```
┌────────────────────────────┐
│         Browser            │
└─────────────┬──────────────┘
              │
              ▼
      Next.js Route
              │
              ▼
Authentication Layer
              │
              ▼
Authorization Context Builder
              │
              ▼
Authorization Context
              │
              ├──────────────┐
              │              │
              ▼              ▼
     PermissionService   Middleware
              │              │
              └──────┬───────┘
                     ▼
            Business Services
                     │
                     ▼
              Repository Layer
                     │
                     ▼
              PostgreSQL RLS
                     │
                     ▼
                 Database
```

---

# Authorization Context

Authorization Context is created once per request.

It contains all authorization-related information required during request processing.

Recommended structure:

```ts
class AuthorizationContext {

    readonly userId: string;

    readonly neighborhoodId: string;

    readonly roleCode: string;

    readonly permissions: ReadonlySet<string>;

    readonly locale: string;

    readonly timezone: string;

    readonly requestId: string;

    can(permission: string): boolean;

    canAny(...permissions: string[]): boolean;

    canAll(...permissions: string[]): boolean;

    isSelf(userId: string): boolean;

    isSameNeighborhood(
        neighborhoodId: string
    ): boolean;

}
```

Business services must receive AuthorizationContext instead of repeatedly querying permission data.

## AuthorizationContext Responsibilities

AuthorizationContext is a domain object.

It encapsulates all authorization information and exposes helper methods for authorization decisions.

Business modules must never inspect the underlying permission collection directly.

Correct

```ts
authorizationContext.can(
    "payment.approve"
)
```

Correct

```ts
authorizationContext.canAll(
    "resident.view",
    "resident.update"
)
```

Correct

```ts
authorizationContext.canAny(
    "expense.create",
    "expense.update"
)
```

Business Services must never inspect the underlying permission collection directly.

AuthorizationContext is responsible for:

- Permission evaluation
- Ownership checks
- RT scope validation
- Convenience authorization helpers

Business Services must only communicate with AuthorizationContext.

---

# Authorization Context Lifecycle

```
Incoming Request

↓

Authenticate User

↓

Load User

↓

Resolve Role

↓

Load Role Permissions

↓

Apply RT Overrides

↓

Build Authorization Context

↓

Pass Context to Application Layers
```

AuthorizationContext remains immutable during the lifetime of the request.

---

# Layer Responsibilities

## UI Layer

Responsibilities

- Rendering
- User interaction

Must NOT

- Compare roles
- Resolve permissions
- Execute business rules

UI only consumes authorization state.

Example

```ts
const canApprove =
    usePermission("payment.approve");
```

---

## React Hooks

Expose reusable authorization APIs.

Examples

```ts
usePermission()

usePermissions()

useCan()
```

Hooks consume AuthorizationContext.

Hooks never access the database.

---

## Authorization Context

Responsibilities

- Store authenticated user information
- Store effective permissions
- Store current RT
- Store request metadata

AuthorizationContext is immutable.

---

## PermissionService

Responsibilities

- Build effective permissions
- Resolve RT overrides
- Validate permissions
- Provide reusable authorization methods

PermissionService builds AuthorizationContext.

After the context is created, business services should use the context rather than querying PermissionService again.

---

# AuthorizationContext API

AuthorizationContext exposes a small, stable API.

Recommended methods

```ts
authorizationContext.can(
    "resident.view"
)

authorizationContext.canAny(
    "expense.create",
    "expense.update"
)

authorizationContext.canAll(
    "resident.view",
    "resident.update"
)

authorizationContext.isSelf(
    resident.userId
)

authorizationContext.isSameNeighborhood(
    resident.neighborhoodId
)
```

Application code must never inspect permissions directly.

AuthorizationContext owns all authorization helper methods.

---

## Middleware

Responsibilities

- Validate authentication
- Build AuthorizationContext
- Reject unauthorized routes
- Inject AuthorizationContext into request scope

Middleware never executes business logic.

---

## Business Services

Responsibilities

- Execute business rules
- Validate permissions using AuthorizationContext

Business services never compare Role names.

Correct

```ts
authorizationContext.can(
    "payment.approve"
)
```

Correct

```ts
authorizationContext.canAll(
    "resident.view",
    "resident.update"
)
```

Correct

```ts
authorizationContext.canAny(
    "expense.create",
    "expense.update"
)
```

Business Services must never inspect the underlying permission collection directly.

---

## Repository Layer

Responsibilities

- Persistence only

Repositories never perform authorization.

---

## Database

Responsibilities

- Row Level Security

Database remains the final authorization layer.

---

# Effective Permission Resolution

Permission evaluation follows:

```
Role

↓

Role Permissions

↓

RT Permission Overrides

↓

Effective Permissions

↓

Authorization Context
```

Only AuthorizationContext is used afterward.

---

# Navigation

Navigation visibility is permission-driven.

Example

```
Payment

↓

payment.view
```

Navigation never depends on Role names.

---

# API Authorization

Every API endpoint follows:

```
Authentication

↓

Authorization Context

↓

Business Validation

↓

Repository

↓

Response
```

---

# Server Actions

Every Server Action follows:

```
Authentication

↓

Authorization Context

↓

Business Service

↓

Repository
```

---

# Permission Cache

## Per-request memoization (implemented)

`getRequestContext()` is wrapped with `React.cache()`. This ensures PermissionService
is invoked exactly once per Next.js request, regardless of how many server components
or route handlers call `getRequestContext()` in the same request scope.

The memoized context is request-scoped and does not survive across requests.

## Persistent cache (future — Task 2.4)

A TTL-based persistent cache (e.g. per user + per RT, 5-minute TTL) is reserved for
future implementation. The `invalidateCache()` hook on `PermissionService` is a no-op
placeholder for that work.

Invalidation triggers (once implemented):

- Role changes
- RT override changes
- User changes RT

AuthorizationContext itself must never be persistently cached.

Only permission resolution results may be cached.

---

# AuthorizationContext Lifetime

Exactly one AuthorizationContext is created for every incoming request.

```
Request
    │
    ▼
Authentication
    │
    ▼
AuthorizationContextBuilder
    │
    ▼
PermissionService
    │
    ▼
AuthorizationContext
    │
    ▼
Business Services
```

AuthorizationContext must never be shared across requests.

AuthorizationContext is immutable after construction.

---

# RLS

Application authorization is not sufficient.

Every protected operation must also satisfy PostgreSQL RLS.

Application authorization and RLS must produce identical authorization decisions.

---

# Audit Logging

The following events must always be audited:

- Permission Override Updated
- Registration Approved
- Registration Rejected
- Payment Approved
- Payment Rejected
- Expense Created
- Expense Updated
- Expense Deleted
- Ledger Adjustment

Audit logs should include:

- User
- Timestamp
- Action
- Target Entity
- Previous Value
- New Value

---

# Testing Strategy

Authorization must be validated by:

- Unit Tests
- Integration Tests
- Playwright E2E
- RLS Validation

Every layer must produce identical authorization decisions.

## Unit test coverage

| Component | Test file |
|---|---|
| PermissionService.loadPermissions | `lib/auth/__tests__/permission-service.test.ts` |
| PermissionService.buildContext | `lib/auth/__tests__/permission-service.test.ts` |
| AuthorizationContext | `lib/auth/__tests__/authorization-context.test.ts` |
| RequestContext | `lib/auth/__tests__/request-context.test.ts` |
| Authorization helpers | `lib/auth/__tests__/helpers.test.ts` |
| Error classes | `lib/auth/__tests__/errors.test.ts` |
| Override repository | `lib/repositories/__tests__/member-override.repository.test.ts` |

Run with: `npm run test`

---

# Security Principles

1. Authentication is not Authorization.
2. AuthorizationContext is immutable.
3. Every request constructs exactly one AuthorizationContext.
4. UI never performs authorization.
5. Business Services never compare Role names.
6. Business Services only use AuthorizationContext.
7. Repository Layer never performs authorization.
8. Permission evaluation is centralized.
9. RLS remains the final protection layer.
10. AuthorizationContext owns all authorization helper methods.

---

# Future Compatibility

The architecture supports:

- Apartment Communities
- RW-level Administration
- Multi-Tenant Deployment
- Organization Templates
- Permission Profiles

without changing the authorization flow.

---

# Architecture Decision

KasWarga adopts a Permission-Based Authorization Model.

Roles are only containers for default permissions.

AuthorizationContext is the runtime representation of a user's effective authorization.

Business logic depends only on AuthorizationContext.

PermissionService is responsible for constructing AuthorizationContext.

No application layer may bypass AuthorizationContext.

---

# AuthorizationContext Design Principles

AuthorizationContext follows the following design principles.

- Immutable
- Request-scoped
- Lightweight
- Permission-centric
- Independent of UI
- Independent of Database
- Easy to mock during testing

AuthorizationContext should be passed explicitly into Business Services.

Global singleton authorization objects are prohibited.

AuthorizationContext must never be reconstructed during the same request.

Business Services should depend on AuthorizationContext rather than PermissionService whenever possible.