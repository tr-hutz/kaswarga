# AUTHORIZATION_PIPELINE.md

> Project: KasWarga
>
> Version: 2.0 (RBAC v2)

---

# Purpose

This document defines the complete authorization pipeline of KasWarga.

It explains how every incoming request is authenticated, authorized, processed, validated by PostgreSQL RLS, and returned to the client.

This document serves as the runtime authorization reference.

---

# Design Goals

The authorization pipeline is designed to provide:

- Single authorization flow
- Centralized permission evaluation
- Request-scoped authorization
- Zero duplicated permission logic
- Consistent authorization across all application layers
- Clear separation of responsibilities

---

# High-Level Pipeline

```
Browser

↓

Next.js Middleware

↓

Authentication

↓

PermissionService

↓

AuthorizationContext

↓

Business Service

↓

Repository

↓

Supabase

↓

PostgreSQL RLS

↓

Database

↓

Response
```

Every request follows exactly the same pipeline.

---

# Pipeline Overview

## Step 1 — Incoming Request

Request enters the application.

Possible sources:

- Browser
- Server Action
- API Route
- Scheduled Job (future)

---

## Step 2 — Middleware

Middleware responsibilities:

- Validate session
- Reject unauthenticated requests
- Determine protected route
- Continue request

Middleware never performs business logic.

---

## Step 3 — Authentication

Authentication resolves:

- User ID
- Session
- Neighborhood (RT)
- Locale
- Timezone

Failure

```
401 Unauthorized
```

---

## Step 4 — Permission Resolution

PermissionService resolves:

```
User

↓

Role

↓

Role Permissions

↓

RT Overrides

↓

Effective Permissions
```

Permission resolution happens only once.

---

## Step 5 — AuthorizationContext Construction

PermissionService constructs:

```ts
AuthorizationContext
```

The context becomes immutable.

It is reused during the remainder of the request.

---

## Step 6 — Business Service

Business Service receives:

```ts
RequestContext
```

or

```ts
AuthorizationContext
```

Business Services:

- validate business rules
- execute domain logic

Business Services never load permissions again.

---

## Step 7 — Repository

Repository responsibilities:

- Persistence
- Database interaction

Repositories never perform authorization.

Repositories never compare roles.

---

## Step 8 — PostgreSQL RLS

Every protected operation reaches PostgreSQL.

RLS evaluates:

```sql
has_permission(...)
```

If denied

↓

```
403 Forbidden
```

Application authorization and RLS must produce identical results.

---

## Step 9 — Response

Successful response

↓

Browser

Error response

↓

Browser

---

# Sequence Diagram

```
Browser
    │
    ▼
Middleware
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
Business Service
    │
    ▼
Repository
    │
    ▼
Supabase
    │
    ▼
PostgreSQL RLS
    │
    ▼
Database
    │
    ▼
Response
```

---

# AuthorizationContext Lifetime

```
Incoming Request

↓

Create AuthorizationContext

↓

Reuse

↓

Reuse

↓

Reuse

↓

Dispose
```

AuthorizationContext is created once.

AuthorizationContext is immutable.

AuthorizationContext never survives beyond the request.

---

# Dependency Rules

## UI Layer

Allowed

- React Hooks

Forbidden

- Permission Tables
- Supabase
- Role comparisons

---

## React Hooks

Allowed

- AuthorizationContext

Forbidden

- Database
- PermissionService

---

## Middleware

Allowed

- Authentication
- PermissionService

Forbidden

- Business Services

---

## Business Services

Allowed

- AuthorizationContext
- Repository

Forbidden

- Permission Tables
- Role comparisons
- Supabase Client

---

## Repository

Allowed

- Supabase

Forbidden

- Authorization
- Business Logic

---

## PostgreSQL

Allowed

- RLS
- has_permission()

Forbidden

- Business Logic

---

# Error Flow

Authentication Failure

↓

401 Unauthorized

---

Permission Failure

↓

403 Forbidden

---

Business Validation Failure

↓

422 Unprocessable Entity

---

Unexpected Error

↓

500 Internal Server Error

---

# Permission Resolution Rules

Permission evaluation order

```
Role

↓

Role Permission

↓

RT Override

↓

Effective Permission

↓

AuthorizationContext
```

Permission resolution occurs only once.

---

# Request Processing Rules

Every request must:

- authenticate
- build AuthorizationContext
- execute business rules
- access repository
- pass PostgreSQL RLS

Skipping any stage is prohibited.

---

# Testing Requirements

Every protected feature must be validated using:

- Unit Test
- Integration Test
- Playwright
- PostgreSQL RLS

All layers must return identical authorization decisions.

---

# Performance Guidelines

Permission resolution:

One time per request.

AuthorizationContext:

Reused during request lifetime.

Repository:

Never reload permissions.

---

# Security Principles

- Authentication is not Authorization.
- AuthorizationContext is immutable.
- Repository never performs authorization.
- UI visibility does not grant access.
- RLS remains the final security layer.
- Permission evaluation is centralized.

---

# Architecture Decision

KasWarga uses a Request-Scoped Authorization Pipeline.

Every request constructs exactly one AuthorizationContext.

Business Services depend exclusively on AuthorizationContext.

PermissionService exists solely to build AuthorizationContext.

Authorization decisions remain consistent across Middleware, Business Services, and PostgreSQL RLS.