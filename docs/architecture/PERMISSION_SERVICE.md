# PERMISSION_SERVICE.md

> Project: KasWarga
>
> Version: 2.0 (RBAC v2)

---

# Purpose

PermissionService is responsible for constructing the AuthorizationContext.

It is the only application component allowed to resolve permissions from the database.

Business Services must never query authorization tables directly.

PermissionService does **not** execute business rules.

---

# Responsibilities

PermissionService is responsible for:

- Loading User authorization data
- Resolving User Role
- Loading default Role permissions
- Applying RT Permission Overrides
- Computing Effective Permissions
- Building AuthorizationContext
- Caching permission resolution
- Invalidating authorization cache

PermissionService is **not** responsible for:

- Business validation
- UI visibility
- Repository access control
- RLS enforcement

---

# Architecture Position

```
Incoming Request

↓

Authentication

↓

PermissionService

↓

AuthorizationContext

↓

Business Services

↓

Repository

↓

PostgreSQL RLS
```

PermissionService participates only during AuthorizationContext construction.

---

# AuthorizationContext Builder

PermissionService exposes a single public entry point.

```ts
buildContext(
    userId: string
): Promise<AuthorizationContext>
```

Business Services must never call PermissionService again after AuthorizationContext has been created.

---

# Internal Resolution Flow

Permission resolution follows:

```
Load User

↓

Resolve Role

↓

Load Default Role Permissions

↓

Load RT Overrides

↓

Merge Permissions

↓

Create AuthorizationContext
```

---

# Public API

Only the following method is public.

```ts
class PermissionService {

    buildContext(
        userId: string
    ): Promise<AuthorizationContext>;

}
```

No other permission methods should be publicly exposed.

---

# Internal API

The following methods should remain private.

```ts
resolveRole()

loadRolePermissions()

loadPermissionOverrides()

mergePermissions()

createAuthorizationContext()

loadUserNeighborhood()

loadUserLocale()

loadUserTimezone()

invalidateCache()
```

These methods are implementation details.

---

# Effective Permission Algorithm

```
Role

↓

Role Permissions

↓

RT Overrides

↓

Effective Permission Set

↓

AuthorizationContext
```

PermissionService always produces a complete Effective Permission Set.

Business Services never merge permissions.

---

# AuthorizationContext Construction

AuthorizationContext should contain all information required during request execution.

Recommended structure

```ts
class AuthorizationContext {

    readonly userId: string;

    readonly neighborhoodId: string;

    readonly roleCode: string;

    readonly permissions: ReadonlySet<string>;

    readonly locale: string;

    readonly timezone: string;

    readonly requestId: string;

}
```

PermissionService fully initializes this object.

---

# Permission Resolution Rules

Evaluation order

1. Load Role.
2. Load default permissions.
3. Load RT overrides.
4. Override defaults.
5. Freeze Effective Permission Set.
6. Construct AuthorizationContext.

The Effective Permission Set is immutable.

---

# Cache Strategy

Permission resolution may be cached.

Recommended cache key

```
userId

+

neighborhoodId

+

roleVersion
```

Recommended TTL

```
5 minutes
```

AuthorizationContext itself must never be cached.

Only permission resolution may be cached.

---

# Cache Invalidation

Cache must be invalidated when:

- User Role changes
- RT changes
- Permission Override changes
- Default Role Permission changes
- User account disabled

---

# Error Handling

PermissionService should fail fast.

Examples

Unknown User

↓

Throw AuthorizationException

Unknown Role

↓

Throw AuthorizationException

Missing Permission

↓

Return empty Effective Permission Set

Corrupted Permission Mapping

↓

Throw AuthorizationException

Business Services should never receive partially constructed AuthorizationContext.

---

# AuthorizationContext Ownership

AuthorizationContext belongs to a single request.

```
Request

↓

AuthorizationContext

↓

Business Services

↓

Destroyed
```

AuthorizationContext must never be reused across requests.

---

# Dependencies

PermissionService depends on:

- User Repository
- Role Repository
- Permission Repository
- RT Permission Override Repository
- Cache Provider

PermissionService must not depend on:

- UI Components
- React
- Business Modules
- Controllers

---

# Testing Strategy

PermissionService should be tested independently.

Recommended tests

- User with default Role
- User with RT Override
- Multiple RT Overrides
- Missing Role
- Disabled User
- Cache Hit
- Cache Miss
- Cache Invalidation
- Empty Permission Set

Business Services should mock AuthorizationContext instead of mocking PermissionService.

---

# Performance

Permission resolution should occur only once per request.

Business Services must reuse AuthorizationContext.

Repeated database permission lookups are prohibited.

---

# Security Principles

- Permission resolution is centralized.
- AuthorizationContext is immutable.
- Business Services never query permission tables.
- PermissionService never executes business rules.
- Repository Layer never performs authorization.
- PostgreSQL RLS remains the final protection layer.

---

# Design Principles

PermissionService follows:

- Single Responsibility Principle
- Fail Fast
- Immutable Output
- Request Scoped
- Cache Friendly
- Easily Testable

PermissionService is responsible only for constructing AuthorizationContext.

All authorization decisions during request execution must rely exclusively on AuthorizationContext.

---

# Sequence Diagram

```
Incoming Request
        │
        ▼
 Authentication
        │
        ▼
 PermissionService
        │
        ├── Load User
        ├── Resolve Role
        ├── Load Role Permissions
        ├── Load RT Overrides
        ├── Merge Effective Permissions
        └── Build AuthorizationContext
                │
                ▼
      AuthorizationContext
                │
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
            Response
```

---

# Architecture Decision

PermissionService is intentionally designed as an AuthorizationContext Builder.

It does not replace AuthorizationContext.

It exists solely to centralize permission resolution and create a fully initialized AuthorizationContext for every incoming request.

Business Services depend on AuthorizationContext, not on PermissionService.