# REQUEST_CONTEXT.md

> Project: KasWarga
>
> Version: 2.0 (RBAC v2)

---

# Purpose

RequestContext is the root runtime object for every incoming request.

It contains all request-scoped information required by the application.

Every Business Service should receive exactly one RequestContext.

---

# Goals

RequestContext provides:

- Single source of request information
- Consistent authorization
- Request tracing
- Localization
- Audit support
- Future extensibility

---

# Architecture

```
Incoming Request
        │
        ▼
Authentication
        │
        ▼
PermissionService
        │
        ▼
AuthorizationContext
        │
        ▼
RequestContext
        │
        ▼
Business Services
```

---

# Responsibilities

RequestContext stores:

- Request metadata
- User information
- Localization
- Authorization
- Trace information

RequestContext does NOT:

- Query the database
- Execute business rules
- Resolve permissions

---

# Structure

```ts
class RequestContext {

    readonly requestId: string;

    readonly locale: string;

    readonly timezone: string;

    readonly ipAddress: string;

    readonly userAgent: string;

    readonly authorization: AuthorizationContext;

}
```

---

# AuthorizationContext

AuthorizationContext is part of RequestContext.

```
RequestContext
        │
        ▼
AuthorizationContext
        │
        ├── userId
        ├── neighborhoodId
        ├── roleCode
        ├── permissions
        └── helper methods
```

Business Services access authorization through:

```ts
context.authorization.can(...)
```

---

# Lifetime

RequestContext exists only during one request.

```
Incoming Request

↓

Create RequestContext

↓

Business Services

↓

Dispose
```

It must never be shared between requests.

---

# Immutability

RequestContext is immutable.

Properties must never change after construction.

Mutable request-scoped state is prohibited.

---

# Usage

Business Service example

```ts
paymentService.approve(

    context,

    paymentId

)
```

Expense Service

```ts
expenseService.create(

    context,

    dto

)
```

Resident Service

```ts
residentService.update(

    context,

    residentId,

    dto

)
```

---

# Logging

RequestContext provides:

```
requestId

↓

Logger
```

Every log entry should include:

- requestId
- userId
- module
- operation

---

# Audit

Audit entries should use:

```
context.authorization.userId
```

No additional user lookup is required.

---

# Localization

Business Services should use:

```
context.locale
```

Formatting should use:

```
context.timezone
```

Business Services must not access browser locale directly.

---

# Authorization

Authorization is delegated to:

```ts
context.authorization
```

Examples

```ts
context.authorization.can(
    "payment.approve"
)
```

```ts
context.authorization.canAny(
    "expense.create",
    "expense.update"
)
```

---

# Dependency Rules

Business Services

Allowed

- RequestContext

Forbidden

- auth()
- cookies()
- headers()
- Permission tables
- Session lookup

---

# Creation

RequestContext is created by `getRequestContext()` in `lib/auth/server.ts`.

```ts
// lib/auth/server.ts
export const getRequestContext = cache(async () => {
  // 1. Validate session via supabase.auth.getUser()
  // 2. Call createRequestContext(user.id, { headers })
  //    which calls PermissionService.buildContext(userId)
  // 3. Returns RequestContext
})
```

`getRequestContext()` is memoized with `React.cache()`. Within the same
request scope, the first call resolves permissions and builds the context.
Every subsequent call in the same request returns the cached instance —
PermissionService is never invoked more than once per request.

```
Authentication (getUser)

↓

PermissionService.buildContext

↓

createRequestContext

↓

RequestContext (cached via React.cache)
```

Business Services never construct RequestContext directly.

---

# Testing

Unit Tests should mock RequestContext.

Example

```ts
const context =

createMockRequestContext();
```

Business Services should never require authentication during unit tests.

---

# Security

RequestContext is trusted only inside the server.

It must never be serialized to the browser.

Only selected values may be exposed through React Hooks.

---

# Future Compatibility

RequestContext can be extended with:

- Correlation ID
- Feature Flags
- Tenant Information
- Device Information
- Request Metrics

without changing Business Service contracts.

---

# Design Principles

RequestContext follows:

- Immutable
- Request Scoped
- Lightweight
- Explicit Dependency
- Easy to Mock
- Easy to Extend

Business Services should always receive RequestContext instead of individual parameters.

This keeps service contracts stable while allowing future platform evolution.