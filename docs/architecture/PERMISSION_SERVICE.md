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

PermissionService exposes two public methods.

`buildContext` is the preferred entry point for all server-side request handling. It automatically resolves the user's active RT membership and is optimized to 4 database calls.

`loadPermissions` is retained for cases where the caller already knows the `neighborhoodId` (e.g. utility scripts, background jobs).

```ts
// Preferred — auto-resolves RT, 4 DB calls
buildContext(userId: string): Promise<AuthorizationContext>

// Legacy — caller supplies neighborhoodId, 5 DB calls
loadPermissions(userId: string, neighborhoodId: string): Promise<PermissionSet>
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

The following methods are public.

```ts
class PermissionService {

    // Preferred: auto-resolves RT membership, 4 DB calls
    buildContext(userId: string): Promise<AuthorizationContext>

    // Legacy: caller provides neighborhoodId, 5 DB calls
    loadPermissions(userId: string, neighborhoodId: string): Promise<PermissionSet>

    // No-op hook reserved for future cache invalidation
    invalidateCache(userId: string, neighborhoodId: string): void

}
```

---

# Internal API

The following methods are private implementation details.

```ts
// Used by buildContext — single memberships query that detects SUPER_ADMIN
resolveUserMembership(userId)

// Used by both buildContext and loadPermissions
resolveRoleId(roleCode)
fetchRolePermissions(roleId)
fetchPermissionOverrides(neighborhoodId, roleId)
merge(granted, overrides)

// Used only by loadPermissions (legacy path)
checkSuperAdmin(userId)
resolveMembership(userId, neighborhoodId)
loadUserNeighborhood(userId)
```

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

`getRequestContext()` in `lib/auth/server.ts` is memoized with `React.cache()`. This ensures that PermissionService is invoked exactly once per request regardless of how many server components or handlers call `getRequestContext()`.

`buildContext` database call count (non-SUPER_ADMIN):

| Step | Query | Notes |
|---|---|---|
| 1 | `memberships` | Single query; detects SUPER_ADMIN |
| 2 | `roles` | Lookup by role code |
| 3+4 | `role_permissions` + `rt_permission_overrides` | Parallel |

SUPER_ADMIN short-circuits after step 1 — no role table queries.

`loadPermissions` uses 5 sequential + parallel calls (checkSuperAdmin, resolveMembership, resolveRoleId, then fetchRolePermissions + fetchPermissionOverrides in parallel).

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