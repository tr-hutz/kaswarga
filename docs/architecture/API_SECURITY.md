# API_SECURITY.md

> Project: KasWarga
>
> Version: 2.0 (RBAC v2)

---

# Purpose

This document defines the security standard for every API endpoint and Route Handler in KasWarga.

The objective is to ensure that every request follows the same authentication, authorization, validation, and auditing pipeline.

This document applies to:

- Route Handlers (`app/api/**`)
- Internal APIs
- Public APIs (future)
- Webhooks
- Background Jobs (future)

---

# Security Principles

Every API endpoint must satisfy the following principles:

- Authenticate first
- Authorize second
- Validate third
- Execute business logic
- Persist data
- Audit sensitive operations
- Return standardized responses

No API endpoint may bypass this flow.

---

# Standard API Pipeline

```
Incoming Request

↓

Authentication

↓

RequestContext

↓

Input Validation

↓

Business Service

↓

Repository

↓

PostgreSQL RLS

↓

Audit Log

↓

Response
```

---

# Responsibilities

## Route Handler

Responsible for:

- Reading request
- Validating authentication
- Building RequestContext
- Parsing input
- Calling Business Service
- Returning response

Must NOT:

- Execute business rules
- Query permission tables
- Access database directly

---

## Business Service

Responsible for:

- Business validation
- Authorization
- Transaction orchestration
- Audit event creation

Must NOT:

- Read cookies
- Read headers
- Read sessions

---

## Repository

Responsible only for persistence.

Repositories never perform authorization.

---

# Authentication

Every protected endpoint must authenticate.

Authentication failure

↓

401 Unauthorized

Public endpoints may skip authentication.

Examples

- Login
- Forgot Password
- Health Check

---

# Authorization

Authorization is performed using

```ts
RequestContext.authorization
```

Example

```ts
context.authorization.can(
    "payment.approve"
)
```

Role comparisons are prohibited.

---

# Input Validation

Input validation belongs to the API boundary.

Recommended

- Zod
- DTO Validation
- Schema Validation

Business validation belongs to Business Services.

---

# Business Validation

Examples

Payment already approved

↓

422

Expense amount invalid

↓

422

Resident already registered

↓

409

Business validation must never be implemented inside Route Handlers.

---

# Repository Access

Correct

```
API

↓

Business Service

↓

Repository
```

Forbidden

```
API

↓

Supabase

↓

Database
```

---

# Audit Logging

Sensitive operations must create Audit Logs.

Examples

- Payment Approval
- Payment Rejection
- Expense Create
- Expense Update
- Expense Delete
- Resident Approval
- Resident Rejection
- Permission Override Update

Audit logging belongs to Business Services.

---

# HTTP Status Codes

Standard response mapping

| Status | Meaning |
|---------|----------|
| 200 | Success |
| 201 | Resource Created |
| 204 | No Content |
| 400 | Invalid Request |
| 401 | Unauthenticated |
| 403 | Permission Denied |
| 404 | Resource Not Found |
| 409 | Conflict |
| 422 | Business Validation Failed |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

These mappings should remain consistent across the application.

---

# Standard Response

Recommended success response

```json
{
    "success": true,
    "data": {}
}
```

Recommended error response

```json
{
    "success": false,
    "error": {
        "code": "PAYMENT_ALREADY_APPROVED",
        "message": "Payment has already been approved."
    }
}
```

Stack traces must never be exposed.

---

# Rate Limiting

Recommended protection

Authentication endpoints

- strict

Mutation endpoints

- medium

Read endpoints

- relaxed

Rate limiting strategy may evolve independently.

---

# CSRF Protection

State-changing endpoints must be protected against CSRF where applicable.

Authentication strategy should determine the appropriate protection mechanism.

---

# Idempotency

The following operations should be idempotent where possible:

- Payment Approval
- Payment Rejection
- Resident Approval
- Resident Rejection

Repeated requests must not create duplicate side effects.

---

# Transactions

Transactions belong to Business Services.

API endpoints never begin database transactions.

---

# Logging

Every API request should log

- requestId
- route
- method
- authenticated user
- response time
- status code

Sensitive information must never be logged.

---

# Error Handling

Authentication Failure

↓

401

Authorization Failure

↓

403

Business Validation

↓

422

Unexpected Exception

↓

500

Responses must remain consistent.

---

# Webhooks

Webhooks require additional validation.

Examples

- Signature verification
- Replay protection
- Timestamp validation

Webhook authentication differs from user authentication.

---

# Testing Requirements

Every protected endpoint must have tests covering:

- Anonymous access
- Authenticated access
- Authorized access
- Unauthorized access
- Invalid payload
- Valid payload
- Business validation
- Audit log creation
- RLS enforcement

---

# Security Checklist

Every API endpoint must satisfy:

✓ Authentication

✓ RequestContext

✓ Input validation

✓ Authorization

✓ Business validation

✓ Repository isolation

✓ PostgreSQL RLS

✓ Audit logging

✓ Standard response

✓ Standard error handling

---

# Architecture Decision

KasWarga follows a Defense in Depth strategy.

Security is enforced at multiple layers:

Authentication

↓

AuthorizationContext

↓

Business Service

↓

Repository

↓

PostgreSQL RLS

↓

Database

No single layer is trusted on its own.

Every protected operation must successfully pass all applicable security layers.