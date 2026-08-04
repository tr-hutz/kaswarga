# DATA_DICTIONARY.md

> Project: KasWarga

Version: 1.0

---

# Purpose

This document defines the business meaning of every table and important column.

It serves as the single source of truth for domain terminology.

---

# users

Business Owner

Authentication

Description

Represents a person who can sign into KasWarga.

Notes

A user may belong to multiple RT.

---

email

Unique login identity.

---

is_active

Determines whether login is permitted.

---

# memberships

Description

Connects User with RT and Role.

Business Rule

One user may have multiple memberships.

---

role_id

Defines permissions.

---

status

ACTIVE

INACTIVE

SUSPENDED

---

# residents

Description

Represents a household member within an RT.

A resident always belongs to exactly one RT.

---

block

Residential block identifier.

---

house_number

Official house number.

---

# payments

Description

Represents a payment submitted by a resident.

A payment begins with

PENDING

and ends with

APPROVED

or

REJECTED.

---

amount

Total payment amount.

Must be greater than zero.

---

proof_url

Uploaded payment receipt.

---

status

Business state.

See

STATE_MACHINE.md

---

# expenses

Description

Money leaving RT funds.

Expenses automatically affect balance.

---

# ledger_entries

Description

Official accounting record.

Append-only.

Never delete.

---

reference_type

Origin of ledger entry.

Examples

PAYMENT

EXPENSE

ADJUSTMENT

---

balance

Running balance after transaction.

---

# notifications

Description

Message delivered to a user.

Notifications never contain business logic.

---

is_read

Whether recipient has opened the notification.

---

# activity_logs

Description

Immutable audit history.

Should never be edited.

---

action

Business event.

See

GLOSSARY.md

---

metadata

Additional JSON payload.

---

# activation_tokens

Description

Temporary token used for first-time activation.

Automatically expires.

---

# rt_registration_requests

Description

Temporary request before RT creation.

No business entities are created until approval.

---

# resident_registration_requests

Description

Temporary resident request awaiting approval.

---

# Authorization (RBAC v2)

KasWarga implements Role-Based Access Control (RBAC v2).

Authorization is determined by:

```
User
    ↓
Role
    ↓
Default Role Permissions
    ↓
RT Permission Override
    ↓
Effective Permission
```

Permissions are never assigned directly to users.

---

# Entity: Permission Group

## Purpose

Permission Groups organize permissions into logical business modules.

Permission Groups improve:

- Permission Management UI
- Documentation
- Navigation
- Future Permission Profiles

Permission Groups do not affect authorization.

---

## Examples

Resident

Payment

Expense

Ledger

Report

Notification

---

## Business Rules

- Groups are organizational only.
- Every permission belongs to one group.
- Group names may be localized.
- Group codes are immutable.

---

# Entity: Permission

## Purpose

A Permission represents one business capability.

Permissions are the only identifiers used by authorization.

Business logic must never depend on role names.

---

## Naming Convention

Permissions follow:

```
module.action
```

Examples

```
resident.view
resident.create
resident.update

payment.submit
payment.approve

expense.create

ledger.export
```

---

## Business Rules

- Permission codes are immutable.
- Permission codes are globally unique.
- Permission codes are referenced throughout the application.
- Permission labels may be translated.
- Permission codes must never be translated.

---

## Referenced By

- PermissionService
- Middleware
- Navigation
- Backend Services
- API Authorization
- Playwright Authorization Tests
- RLS Policies
- AuthorizationContext
- RequestContext

---

# Entity: Role Permission

## Purpose

Defines the default permission set of a Role.

This represents the system baseline.

Every RT starts with these permissions.

---

## Business Rules

- Default permissions are maintained by the system.
- Missing permissions are interpreted as Denied.
- Default permissions should rarely change.

---

# Entity: RT Permission Override

## Purpose

Stores exceptions from the default permission set.

Only differences are stored.

---

## Business Rules

If no override exists:

Use the default role permission.

If an override exists:

Use the override.

Deleting an override restores the default permission automatically.

---

## Example

Default

Treasurer

```
resident.create = false
```

RT Override

```
resident.create = true
```

Effective Permission

```
resident.create = true
```

---

# Effective Permission

Every authorization decision is based on the Effective Permission.

The Effective Permission is calculated using:

1. User Role
2. Default Role Permission
3. RT Permission Override

Business modules never know where a permission originates.

---

---

# Entity: Authorization Context

## Purpose

AuthorizationContext is the runtime authorization object used throughout a single request.

It is constructed once by PermissionService after successful authentication.

Business Services consume AuthorizationContext instead of querying authorization tables directly.

AuthorizationContext is never persisted in the database.

---

## Contents

AuthorizationContext contains:

- userId
- neighborhoodId
- roleCode
- effective permissions
- helper authorization methods

---

## Business Rules

- AuthorizationContext exists only during one request.
- AuthorizationContext is immutable.
- AuthorizationContext is constructed exactly once.
- Business Services must never modify AuthorizationContext.
- Repository Layer must never access AuthorizationContext.

---

## Lifetime

```
Incoming Request

↓

PermissionService

↓

AuthorizationContext

↓

Business Services

↓

Disposed
```

AuthorizationContext is recreated for every request.

It is never shared between requests.

---

## Responsibility

AuthorizationContext is responsible only for authorization.

It does not perform:

- authentication
- database access
- business validation

AuthorizationContext provides the current authorization state for the active request.

# Permission Service

Every authorization check must go through PermissionService.

Correct

```ts
permissionService.hasPermission(
    userId,
    "payment.approve"
)
```

Incorrect

```ts
role === "TREASURER"
```

PermissionService is the single source of truth for authorization.

End of Document