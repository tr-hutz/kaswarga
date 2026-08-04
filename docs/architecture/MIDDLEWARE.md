# MIDDLEWARE.md

> Project: KasWarga
>
> Version: 2.0 (RBAC v2)

---

# Purpose

Middleware is responsible for validating incoming requests before they reach the application.

Middleware performs only request-level validation.

It never executes business logic.

---

# Responsibilities

Middleware is responsible for:

- Session validation
- Authentication
- Route protection
- Building RequestContext
- Injecting RequestContext into the request lifecycle
- Early rejection of unauthorized requests

Middleware is NOT responsible for:

- Business validation
- Database queries unrelated to authentication
- UI rendering
- Permission decisions for business operations

---

# Middleware Pipeline

```
Incoming Request

↓

Read Session

↓

Authenticate User

↓

PermissionService.buildContext()

↓

RequestContextFactory

↓

RequestContext

↓

Continue Request
```

---

# Request Flow

```
Browser

↓

Middleware

↓

Authentication

↓

PermissionService

↓

AuthorizationContext

↓

RequestContext

↓

Next.js Route

↓

Business Service
```

---

# Authentication

Middleware authenticates the user.

Possible results

Authenticated

↓

Continue

Unauthenticated

↓

401 Unauthorized

---

# Route Protection

Middleware determines whether a route requires authentication.

Example

Public

- Login
- Register
- Forgot Password

Protected

- Dashboard
- Resident
- Payment
- Expense
- Ledger
- Reports

---

# RequestContext

Middleware creates RequestContext exactly once.

Business Services must never create RequestContext.

---

# RequestContext Injection

Recommended

```
Middleware

↓

RequestContext

↓

Request Scope

↓

Server Action / API Route
```

RequestContext should be retrievable through a dedicated helper.

Example

```ts
const context = await getRequestContext();
```

Business Services should never access cookies(), headers(), or auth() directly.

---

# Authorization

Middleware validates authentication only.

Business authorization remains inside Business Services.

Example

Allowed

```
Authenticated User

↓

Continue

↓

Business Service

↓

context.authorization.can(...)
```

Forbidden

```
Middleware

↓

role == TREASURER
```

---

# Error Handling

Authentication Failure

↓

401 Unauthorized

---

Invalid Session

↓

401 Unauthorized

---

Unexpected Middleware Failure

↓

500 Internal Server Error

---

# Logging

Middleware should log

- requestId
- route
- method
- authenticated user
- execution time

No sensitive information should be logged.

---

# Performance

Middleware should avoid unnecessary database access.

Permission resolution must happen only once.

---

# Security

Middleware must never:

- compare role names
- execute business rules
- perform repository operations
- bypass authentication

---

# Testing

Middleware tests should cover

- authenticated request
- unauthenticated request
- expired session
- invalid token
- RequestContext creation
- requestId generation

---

# Design Principles

Middleware is intentionally lightweight.

Authentication belongs to Middleware.

Authorization belongs to AuthorizationContext.

Business validation belongs to Business Services.

Persistence belongs to Repository.

This separation must never be violated.