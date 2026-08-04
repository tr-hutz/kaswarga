# SERVER_ACTION_GUIDELINES.md

> Project: KasWarga
>
> Version: 2.0 (RBAC v2)

---

# Purpose

This document defines the implementation standard for all Next.js Server Actions.

Every Server Action must follow a consistent execution flow.

Server Actions are responsible for:

- Receiving client requests
- Creating RequestContext
- Calling Business Services
- Returning results

Server Actions must never contain business logic.

---

# Responsibilities

Server Actions are responsible for:

- Reading request input
- Validating authentication
- Obtaining RequestContext
- Calling Business Services
- Returning standardized responses

Server Actions are NOT responsible for:

- Business validation
- Authorization logic
- Database queries
- SQL
- Permission resolution

---

# Standard Flow

Every Server Action follows exactly this flow.

```
Client

↓

Server Action

↓

getRequestContext()

↓

Business Service

↓

Repository

↓

PostgreSQL RLS

↓

Response
```

---

# Required Pattern

Every Server Action should follow this structure.

```ts
"use server";

export async function execute(...) {

    const context = await getRequestContext();

    return residentService.create(
        context,
        ...
    );

}
```

---

# Forbidden Pattern

Never perform authorization manually.

Incorrect

```ts
const user = await auth();

if (user.role === "TREASURER") {

}
```

Incorrect

```ts
const permissions =
    await loadPermissions(...);
```

Incorrect

```ts
const supabase =
    createClient();

await supabase
    .from(...)
```

Server Actions must never access repositories directly.

---

# RequestContext

Every Server Action must retrieve RequestContext.

Example

```ts
const context =
    await getRequestContext();
```

Business Services must receive RequestContext.

---

# Business Services

Server Actions delegate all business logic.

Correct

```
Server Action

↓

Business Service

↓

Repository
```

Forbidden

```
Server Action

↓

Supabase

↓

Update Database
```

---

# Validation

Input validation belongs to the application boundary.

Recommended:

- Zod
- Schema validation
- DTO validation

Business validation remains inside Business Services.

---

# Error Handling

Server Actions should map exceptions to user-friendly responses.

Examples

Authentication Failure

↓

401

Authorization Failure

↓

403

Business Validation

↓

422

Unexpected Error

↓

500

Server Actions should never expose internal stack traces.

---

# Logging

Server Actions should log:

- requestId
- operation
- module
- execution time

No sensitive information should be logged.

---

# Transaction Boundary

Transactions belong to Business Services.

Server Actions must never start database transactions.

---

# Dependencies

Allowed

- RequestContext
- DTO
- Business Service

Forbidden

- Repository
- Supabase Client
- SQL
- Permission Tables

---

# Return Types

Server Actions should return standardized results.

Recommended

```ts
ActionResult<T>
```

Example

```ts
{
    success: true,
    data: ...
}
```

Error

```ts
{
    success: false,
    error: ...
}
```

Avoid returning raw database objects.

---

# File Upload

File uploads should follow:

```
Server Action

↓

Storage Service

↓

Business Service

↓

Repository
```

Business Services should never receive uploaded files directly.

---

# Audit Logging

Business Services create Audit Logs.

Server Actions never write Audit Logs.

---

# Testing

Server Actions should be tested for:

- authentication
- invalid input
- authorization
- successful execution
- exception mapping

Business logic should be mocked during unit tests.

---

# Design Principles

Server Actions are thin.

Business Services are smart.

Repositories persist data.

Authorization is performed through RequestContext.

This separation must remain consistent across the entire application.

---

# Sequence Diagram

```
Client
    │
    ▼
Server Action
    │
    ▼
getRequestContext()
    │
    ▼
Business Service
    │
    ▼
Repository
    │
    ▼
PostgreSQL RLS
    │
    ▼
Response
```

---

# Architecture Decision

Server Actions are application entry points.

They orchestrate request processing but never contain business rules.

All authorization decisions rely on RequestContext.

All persistence operations go through Business Services and Repositories.