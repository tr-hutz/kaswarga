# API_CONVENTION.md

> Project: KasWarga
>
> Version: 1.0
>
> Last Updated: July 2026

---

# 1. Purpose

This document defines the API conventions used throughout the KasWarga project.

The objectives are:

- Ensure consistency
- Standardize communication between frontend and backend
- Simplify maintenance
- Improve security
- Support future integrations

KasWarga primarily uses **Next.js Server Actions** and **Supabase**. Traditional REST endpoints should only be created when necessary.

---

# 2. API Philosophy

KasWarga follows a **Service-Oriented Architecture**.

Client Components

↓

Server Action

↓

Service

↓

Repository

↓

Supabase

Business logic MUST never be implemented inside Client Components.

---

# 3. Preferred Communication

Priority

1. Server Actions
2. Route Handlers
3. External REST API

Use Server Actions whenever possible.

Only create REST endpoints for:

- external integrations
- webhook receivers
- mobile applications
- third-party services

---

# 4. Layer Responsibility

## Client Component

Responsible for

- UI
- Form handling
- User interaction

Must NOT

- query Supabase
- contain business logic

---

## Server Action

Responsible for

- request orchestration
- authentication
- validation
- calling Services

Must NOT

- contain SQL
- duplicate business rules

---

## Service

Responsible for

- business logic
- transaction orchestration
- activity log
- notification

---

## Repository

Responsible only for

- SELECT
- INSERT
- UPDATE
- DELETE

---

# 5. Request Validation

Every request must be validated.

Recommended library

Zod

Validation should occur

Client

↓

Server Action

↓

Database

Never trust client input.

---

# 6. Authentication

Authentication uses

Supabase Auth

Current methods

- Email
- Password

Future

- Google OAuth
- OTP

Every protected action must verify authentication.

---

# 7. Authorization

Authorization is role-based.

Permissions are determined by

User

↓

Membership

↓

Role

↓

Permission

Never trust hidden UI.

Every request must verify authorization.

---

# 8. Response Structure

All Server Actions should return a predictable structure.

Success

```ts
{
    success: true,
    data,
    message
}
```

Failure

```ts
{
    success: false,
    message,
    errors
}
```

Avoid returning raw Supabase responses directly to the UI.

---

# 9. Error Handling

Business errors

```
PAYMENT_ALREADY_APPROVED

RESIDENT_NOT_FOUND

INVALID_ROLE
```

Unexpected errors

```
INTERNAL_SERVER_ERROR
```

Never expose SQL errors.

Never expose stack traces.

---

# 10. Error Catalog

Business errors should use predefined constants.

Examples

```
PAYMENT_NOT_FOUND

PAYMENT_ALREADY_APPROVED

PAYMENT_ALREADY_REJECTED

RESIDENT_ALREADY_EXISTS

INVALID_RT

ACCESS_DENIED

NOTIFICATION_FAILED
```

---

# 11. DTO

Every complex request should use DTO.

Example

ApprovePaymentRequest

```
paymentId

approvalNote
```

ResidentRegistrationRequest

```
email

name

phoneNumber

block

houseNumber
```

DTO should contain only request data.

Business logic belongs in Services.

---

# 12. Pagination

Use

```
page

pageSize
```

Response

```
data

total

page

pageSize

totalPages
```

---

# 13. Searching

Use

```
search
```

Never

```
keyword

find

queryText
```

---

# 14. Sorting

Use

```
sortBy

sortDirection
```

Example

```
created_at

DESC
```

---

# 15. Filtering

Filters should be optional.

Example

```
status

role

month

year

rtId
```

---

# 16. Transactions

The following operations must be atomic.

Approve Payment

↓

Ledger Entry

↓

Notification

↓

Activity Log

---

Approve RT Registration

↓

Create RT

↓

Create Users

↓

Membership

↓

Notification

---

Resident Registration

↓

Create User

↓

Create Resident

↓

Membership

↓

Activation

---

# 17. File Upload

Files should be uploaded only to

Supabase Storage

Database stores only metadata.

Maximum upload size should be configurable.

Always validate

- MIME type
- file size

---

# 18. Notification

Notification creation belongs in Services.

Never inside Components.

Never inside Repositories.

---

# 19. Activity Log

Every important API action should generate

Activity Log

Examples

```
CREATE_PAYMENT

APPROVE_PAYMENT

UPDATE_RESIDENT

CREATE_EXPENSE
```

---

# 20. API Versioning

Current version

v1

Future versions should follow

```
/api/v2/
```

Never introduce breaking changes without versioning.

---

# 21. Route Naming

Use nouns.

Good

```
/payments

/residents

/notifications
```

Avoid

```
/getPayments

/createResident
```

Actions belong to

POST

PATCH

DELETE

---

# 22. HTTP Method Convention

GET

Read

POST

Create

PATCH

Partial Update

DELETE

Delete

PUT should be avoided unless replacing an entire resource.

---

# 23. Idempotency

Operations such as

Approve Payment

must be idempotent.

Calling twice should not duplicate

- ledger
- notification
- activity log

---

# 24. Performance

Avoid

N+1 queries

Select only required columns.

Use pagination.

Use indexes.

---

# 25. Security

Every request should verify

Authentication

↓

Authorization

↓

Validation

↓

Business Rule

↓

Database

Never trust

- hidden buttons
- disabled forms
- client-side filtering

---

# 26. Logging

Unexpected API errors should be logged.

Business errors should not crash the application.

---

# 27. Testing

Recommended

Unit

Vitest

Integration

Server Actions

End-to-End

Playwright

Mock API

MSW

---

# 28. Future Integrations

Future APIs

- WhatsApp Gateway
- Payment Gateway
- Smart Locker
- Automatic Gate
- Visitor Management
- Office Shuttle

All integrations must follow this document.

---

# 29. Final Principles

Keep APIs predictable.

Keep responses consistent.

Keep business rules centralized.

Keep components simple.

Every new API should comply with this document.

---

End of Document