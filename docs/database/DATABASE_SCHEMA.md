# DATABASE_SCHEMA.md

> Project: KasWarga
>
> Version: 2.0
>
> Last Updated: July 2026

---

# Purpose

This document describes the database schema used by KasWarga.

It documents tables, columns, relationships, indexes, constraints, and storage buckets.

Business meaning is documented separately in DATA_DICTIONARY.md.

---

# Naming Convention

Table

snake_case

Column

snake_case

Primary Key

id (uuid)

Foreign Key

xxx_id

Timestamp

created_at / updated_at

Soft Delete

deleted_at + deleted_by

---

# Schema Overview

Authentication

- users

Organization

- rt
- memberships

Residents

- residents

Finance (Pre-approval)

- payment_confirmations
- confirmation_details

Finance (Approved)

- payments
- payment_details

Finance (Expenses)

- expense_categories
- expenses

Finance (Ledger)

- ledger

Communication

- notifications
- activity_logs

Registration

- registration_requests
- activation_invites

---

# users

Purpose

Public user profile that mirrors auth.users. id must match auth.users.id.

Primary Key

id

Columns

| Column     | Type        | Nullable |
|------------|-------------|----------|
| id         | uuid        | No       |
| name       | text        | Yes      |
| email      | text        | Yes      |
| created_at | timestamptz | No       |
| updated_at | timestamptz | Yes      |
| updated_by | uuid        | Yes      |
| deleted_at | timestamptz | Yes      |
| deleted_by | uuid        | Yes      |

Indexes

- email (unique)

Relationships

One user → Many memberships

Soft Delete

deleted_at / deleted_by (no is_active column)

---

# rt

Purpose

RT profile, contact information, and bank details.

Primary Key

id

Columns

| Column         | Type        | Nullable |
|----------------|-------------|----------|
| id             | uuid        | No       |
| name           | text        | No       |
| code           | text        | Yes      |
| address        | text        | Yes      |
| city           | text        | Yes      |
| province       | text        | Yes      |
| postal_code    | text        | Yes      |
| email          | text        | Yes      |
| phone          | text        | Yes      |
| monthly_fee    | numeric     | No       |
| bank_name      | text        | Yes      |
| account_number | text        | Yes      |
| account_holder | text        | Yes      |
| qris_url       | text        | Yes      |
| logo_url       | text        | Yes      |
| active         | boolean     | No       |
| deleted_at     | timestamptz | Yes      |
| created_at     | timestamptz | No       |
| updated_at     | timestamptz | No       |

Indexes

- code (unique)

Relationships

One RT → Many residents, memberships, payments, expenses, ledger entries

---

# memberships

Purpose

Links an auth user to an RT with a specific role.
rt_id is nullable for SUPER_ADMIN (system-level role).

Primary Key

id

Columns

| Column      | Type        | Nullable |
|-------------|-------------|----------|
| id          | uuid        | No       |
| user_id     | uuid        | No       |
| rt_id       | uuid        | Yes      |
| resident_id | uuid        | Yes      |
| role        | user_role   | No       |
| status      | text        | No       |
| created_at  | timestamptz | No       |

Roles (enum user_role)

SUPER_ADMIN, CHAIR, ADMIN, TREASURER, RESIDENT

Status values

active, deactivated

Indexes

- (user_id, rt_id) unique

Relationships

Many-to-Many: users ↔ rt

---

---

# RBAC Core Tables

KasWarga implements a Role-Based Access Control (RBAC) model with RT-level customization.

The authorization model is composed of the following core tables:

```
roles
    │
    ▼
role_permissions
    │
    ▼
permissions

            ▲
            │
permission_overrides
```

The Role assigned to a Membership does **not** directly determine what a user can do.

The effective authorization is calculated at runtime using:

1. Assigned Role
2. Default Role Permissions
3. RT-specific Permission Overrides
4. AuthorizationContext

This design allows every RT to customize permissions independently while preserving the default system roles.


# residents

Purpose

Resident profile linked to an RT.

Primary Key

id

Columns

| Column       | Type        | Nullable |
|--------------|-------------|----------|
| id           | uuid        | No       |
| rt_id        | uuid        | No       |
| name         | text        | No       |
| block        | text        | Yes      |
| house_number | text        | Yes      |
| email        | text        | Yes      |
| phone        | text        | Yes      |
| active       | boolean     | No       |
| created_at   | timestamptz | No       |
| updated_at   | timestamptz | Yes      |
| updated_by   | uuid        | Yes      |
| deleted_at   | timestamptz | Yes      |
| deleted_by   | uuid        | Yes      |

Relationships

Resident → Many payment_confirmations, payments, confirmation_details, payment_details

---

# payment_confirmations

Purpose

A resident submits this record as proof of monthly dues payment, pending treasurer/admin approval.
Created by the resident. Approved or rejected by TREASURER/CHAIR.

Primary Key

id

Columns

| Column           | Type        | Nullable |
|------------------|-------------|----------|
| id               | uuid        | No       |
| resident_id      | uuid        | No       |
| rt_id            | uuid        | No       |
| year             | integer     | No       |
| total_amount     | bigint      | No       |
| status           | text        | No       |
| proof_url        | text        | Yes      |
| approved_at      | timestamptz | Yes      |
| rejected_at      | timestamptz | Yes      |
| rejection_reason | text        | Yes      |
| created_at       | timestamptz | No       |

Status values

pending, approved, rejected

Relationships

payment_confirmation → Many confirmation_details

On approval: approve_confirmation() creates a payments record and payment_details rows.

---

# confirmation_details

Purpose

Monthly breakdown of a payment confirmation (normalised).
One row per month included in the confirmation.

Primary Key

id

Columns

| Column          | Type        | Nullable |
|-----------------|-------------|----------|
| id              | uuid        | No       |
| confirmation_id | uuid        | No       |
| resident_id     | uuid        | No       |
| year            | integer     | No       |
| month           | integer     | No       |
| amount          | bigint      | No       |
| created_at      | timestamptz | No       |

Relationships

confirmation_details → payment_confirmations (on delete cascade)

---

# payments

Purpose

Approved payment record. Created exclusively by the approve_confirmation() stored function.
Do not insert manually.

Primary Key

id

Columns

| Column       | Type        | Nullable |
|--------------|-------------|----------|
| id           | uuid        | No       |
| resident_id  | uuid        | No       |
| rt_id        | uuid        | No       |
| year         | integer     | No       |
| date         | timestamptz | No       |
| total_amount | bigint      | No       |
| method       | text        | Yes      |
| notes        | text        | Yes      |
| created_at   | timestamptz | No       |

Indexes

- resident_id
- year

Relationships

Payment → Many payment_details

Payment → Ledger entry (pemasukan)

---

# payment_details

Purpose

Monthly breakdown of an approved payment (normalised).
Created exclusively by approve_confirmation().

Primary Key

id

Columns

| Column      | Type        | Nullable |
|-------------|-------------|----------|
| id          | uuid        | No       |
| payment_id  | uuid        | No       |
| resident_id | uuid        | No       |
| year        | integer     | No       |
| month       | integer     | No       |
| amount      | bigint      | No       |
| created_at  | timestamptz | No       |

---

# expense_categories

Purpose

Predefined expense category list for RT financial management.

Primary Key

id (serial)

Columns

| Column     | Type        | Nullable |
|------------|-------------|----------|
| id         | serial      | No       |
| name       | text        | No       |
| sort_order | smallint    | No       |
| created_at | timestamptz | No       |
| updated_at | timestamptz | Yes      |
| updated_by | uuid        | Yes      |
| deleted_at | timestamptz | Yes      |
| deleted_by | uuid        | Yes      |

Indexes

- name (unique)

---

# expenses

Purpose

Expense records (kas keluar). Created by TREASURER, approved by CHAIR.

Primary Key

id

Columns

| Column         | Type        | Nullable |
|----------------|-------------|----------|
| id             | uuid        | No       |
| rt_id          | uuid        | No       |
| receipt_number | text        | Yes      |
| date           | date        | Yes      |
| category       | text        | Yes      |
| amount         | integer     | Yes      |
| recipient      | text        | Yes      |
| description    | text        | Yes      |
| receipt_url    | text        | Yes      |
| active         | boolean     | No       |
| status         | text        | No       |
| created_by     | uuid        | Yes      |
| approved_by    | uuid        | Yes      |
| approved_at    | timestamptz | Yes      |
| rejection_note | text        | Yes      |
| created_at     | timestamptz | No       |
| updated_at     | timestamptz | Yes      |
| updated_by     | uuid        | Yes      |
| deleted_at     | timestamptz | Yes      |
| deleted_by     | uuid        | Yes      |

Status values

pending, approved, rejected

Relationships

Expense → Ledger entry (pengeluaran) on approval via approve_expense()

---

# ledger

Purpose

Running balance ledger per RT. Entries are appended exclusively by insert_ledger().
Do not insert manually.

Primary Key

id

Columns

| Column       | Type        | Nullable |
|--------------|-------------|----------|
| id           | uuid        | No       |
| rt_id        | uuid        | No       |
| type         | varchar(20) | No       |
| source       | varchar(50) | No       |
| reference_id | uuid        | Yes      |
| date         | timestamptz | No       |
| description  | text        | Yes      |
| amount       | bigint      | No       |
| balance_after| bigint      | No       |
| created_by   | uuid        | Yes      |
| created_at   | timestamptz | No       |
| active       | boolean     | No       |

Type values

pemasukan (income), pengeluaran (expense)

Source values

pembayaran, pengeluaran

Note

Previously referred to as `ledger_entries` in older documentation. The actual table name is `ledger`.

---

# notifications

Purpose

In-app notifications targeted at a specific user within an RT.

Primary Key

id

Columns

| Column         | Type        | Nullable |
|----------------|-------------|----------|
| id             | uuid        | No       |
| rt_id          | uuid        | No       |
| type           | varchar(50) | No       |
| title          | text        | No       |
| message        | text        | Yes      |
| entity_type    | varchar(50) | Yes      |
| entity_id      | uuid        | Yes      |
| target_role    | varchar(50) | Yes      |
| target_user_id | uuid        | Yes      |
| is_read        | boolean     | No       |
| created_at     | timestamptz | No       |
| updated_at     | timestamptz | Yes      |
| updated_by     | uuid        | Yes      |
| deleted_at     | timestamptz | Yes      |
| deleted_by     | uuid        | Yes      |

Type values (examples)

payment_pending, payment_approved, payment_rejected, expense_pending, expense_approved, expense_rejected, registration

---

# activity_logs

Purpose

Audit trail of all significant actions performed within an RT.

Primary Key

id

Columns

| Column      | Type         | Nullable |
|-------------|--------------|----------|
| id          | uuid         | No       |
| rt_id       | uuid         | No       |
| actor_id    | uuid         | Yes      |
| actor_name  | text         | Yes      |
| action      | varchar(100) | No       |
| entity_type | varchar(50)  | No       |
| entity_id   | uuid         | Yes      |
| description | text         | Yes      |
| visibility  | varchar(50)  | No       |
| metadata    | jsonb        | Yes      |
| created_at  | timestamptz  | No       |

Indexes

- actor_id
- action
- created_at

Note

The column is named `entity_type` (not `target_type`).

---

# registration_requests

Purpose

Stores pending RT and Resident registration requests awaiting approval.
Uses a `type` discriminator column — there is a single table for both request types.

Primary Key

id

Columns

| Column           | Type        | Nullable |
|------------------|-------------|----------|
| id               | uuid        | No       |
| type             | text        | No       |
| status           | text        | No       |
| rt_code          | text        | Yes      |
| rt_data          | jsonb       | Yes      |
| chair_name       | text        | Yes      |
| chair_email      | text        | Yes      |
| admin_name       | text        | Yes      |
| admin_email      | text        | Yes      |
| treasurer_email  | text        | Yes      |
| treasurer_name   | text        | Yes      |
| resident_name    | text        | Yes      |
| resident_email   | text        | Yes      |
| block            | text        | Yes      |
| house_number     | text        | Yes      |
| phone            | text        | Yes      |
| rt_id            | uuid        | Yes      |
| approved_by      | uuid        | Yes      |
| approved_at      | timestamptz | Yes      |
| rejected_by      | uuid        | Yes      |
| rejected_at      | timestamptz | Yes      |
| rejection_reason | text        | Yes      |
| expires_at       | timestamptz | No       |
| created_at       | timestamptz | No       |
| updated_at       | timestamptz | No       |

Type values

rt, resident

Status values

pending, approved, rejected, expired

Note

Older documentation incorrectly listed two separate tables (`rt_registration_requests` and `resident_registration_requests`).
The actual schema uses a single `registration_requests` table with a `type` discriminator.

---

# activation_invites

Purpose

Tracks email invite links sent to users after their registration is approved.
One row per invite attempt; resend_count increments on each resend.

Primary Key

id

Columns

| Column                   | Type        | Nullable |
|--------------------------|-------------|----------|
| id                       | uuid        | No       |
| registration_request_id  | uuid        | No       |
| email                    | text        | No       |
| role                     | text        | No       |
| rt_id                    | uuid        | Yes      |
| sent_at                  | timestamptz | No       |
| expires_at               | timestamptz | No       |
| activated_at             | timestamptz | Yes      |
| resend_count             | integer     | No       |
| created_at               | timestamptz | No       |

---

# Storage Buckets

| Bucket           | Public | Max Size | Allowed Types                        |
|------------------|--------|----------|--------------------------------------|
| rt-assets        | Yes    | 2 MB     | image/jpeg, image/png, image/webp    |
| payment-proof    | Yes    | 5 MB     | image/jpeg, image/png, application/pdf |
| expense-receipts | Yes    | 5 MB     | image/jpeg, image/png, application/pdf |

---

# Stored Functions

| Function                          | Caller        | Purpose                                                    |
|-----------------------------------|---------------|------------------------------------------------------------|
| approve_confirmation(id, user_id) | authenticated | Validates and approves a payment confirmation; creates payment, payment_details, ledger entry, notification |
| reject_confirmation(id, reason, user_id) | authenticated | Rejects a confirmation; sends notification              |
| approve_expense(id, user_id)      | authenticated | Approves an expense; creates ledger debit entry, notification |
| reject_expense(id, reason, user_id) | authenticated | Rejects an expense; sends notification                   |
| approve_all_pending_expenses(rt_id, user_id) | authenticated | Batch approves all pending expenses for an RT        |
| insert_ledger(...)                | service_role  | Appends a ledger entry with running balance              |
| get_last_balance(rt_id)           | authenticated | Returns the most recent ledger balance for an RT         |
| generate_rt_code()                | authenticated | Returns the next available RT-XXXX code                  |
| is_super_admin()                  | internal      | Returns true when current user is SUPER_ADMIN            |
| is_member_of_rt(rt_id)            | internal      | Returns true when current user is active member of RT    |
| get_user_rt_ids()                 | internal      | Returns all RT IDs the current user belongs to           |
| cleanup_expired_registrations()   | cron          | Marks stale pending requests as expired                  |

---

# Relationship Summary

```
users
  └─ memberships (user_id)
       └─ rt (rt_id)
            ├─ residents (rt_id)
            │    ├─ payment_confirmations (resident_id)
            │    │    └─ confirmation_details (confirmation_id)
            │    └─ payments (resident_id)             ← created by approve_confirmation()
            │         └─ payment_details (payment_id)
            ├─ expenses (rt_id)
            └─ ledger (rt_id)                          ← appended by insert_ledger()

registration_requests (type: rt | resident)
  └─ activation_invites (registration_request_id)

notifications (target_user_id → users)
activity_logs (actor_id → users)
```

---

# Authorization (RBAC v2)

KasWarga implements Role-Based Access Control (RBAC v2).

Authorization is based on:

```
User
    ↓
Role
    ↓
Role Permissions
    ↓
RT Permission Overrides
    ↓
Effective Permission
```

Permissions are assigned to Roles.

Permissions are never assigned directly to Users.

---

# Existing Table Changes

## roles

### New Columns

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| code | varchar(50) | No | Immutable role identifier |

### Constraints

```sql
UNIQUE (code)
```

### Example Values

| code |
|------|
| SUPER_ADMIN |
| RT_CHAIR |
| RT_ADMIN |
| TREASURER |
| RESIDENT |

---

# New Tables

## permissions

Stores every permission supported by the application.

### Design Notes

Permissions represent executable capabilities within the application.

Examples:

- resident.view
- resident.create
- resident.update
- resident.delete
- payment.view
- payment.approve
- payment.reject
- expense.create
- ledger.view
- report.export

Permission codes are immutable identifiers and should never depend on role names.

Business Rules reference authorization conceptually, while permission codes are maintained by the Permission Catalog.

### Columns

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | uuid | No | Primary Key |
| code | varchar(100) | No | Permission identifier |
| name | varchar(150) | No | Display name |
| description | text | Yes | Optional description |
| is_system | boolean | No | Reserved system permission |
| created_at | timestamptz | No | Creation timestamp |
| updated_at | timestamptz | No | Last update timestamp |

### Constraints

```sql
PRIMARY KEY (id)

UNIQUE (code)
```

### Naming Convention

```
module.action
```

Examples

```
resident.view

resident.create

resident.update

resident.delete

registration.approve

payment.submit

payment.approve

payment.reject

expense.create

expense.delete

ledger.export
```

### Recommended Indexes

```sql
CREATE UNIQUE INDEX idx_permissions_code
ON permissions(code);
```

---

## role_permissions

Stores the default permission set for every Role.

### Design Notes

Role Permissions define the default authorization model of KasWarga.

They represent the permissions granted to a Role before any RT-specific customization is applied.

Role Permissions are global and shared across all RTs.

### Columns

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | uuid | No | Primary Key |
| role_id | uuid | No | FK → roles.id |
| permission_id | uuid | No | FK → permissions.id |
| allow | boolean | No | Default permission value |
| created_at | timestamptz | No | Creation timestamp |
| updated_at | timestamptz | No | Last update timestamp |

### Constraints

```sql
PRIMARY KEY (id)

UNIQUE (role_id, permission_id)
```

### Foreign Keys

```sql
role_id
    REFERENCES roles(id)

permission_id
    REFERENCES permissions(id)
```

### role_id

Foreign Key → roles.id

Represents the default role assigned to the member within a neighborhood.

The assigned Role alone does not determine the final authorization result.

Effective authorization is calculated dynamically using:

- Role
- Role Permissions
- RT Permission Overrides
- AuthorizationContext

This allows different RTs to customize permissions without changing the assigned role.

### Recommended Indexes

```sql
CREATE INDEX idx_role_permissions_role
ON role_permissions(role_id);

CREATE INDEX idx_role_permissions_permission
ON role_permissions(permission_id);
```

---

## rt_permission_overrides

Stores permission overrides for each RT.

Only exceptions from the default Role Permission are stored.

### Design Notes

Permission Overrides modify the default authorization behavior for a single RT.

Overrides are evaluated after Role Permissions.

An override may:

- Grant a permission
- Revoke a permission

without modifying the global Role definition.

Permission Overrides affect only the specified RT.

### Columns

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | uuid | No | Primary Key |
| rt_id | uuid | No | FK → neighborhoods.id |
| role_id | uuid | No | FK → roles.id |
| permission_id | uuid | No | FK → permissions.id |
| allow | boolean | No | Override value |
| created_at | timestamptz | No | Creation timestamp |
| updated_at | timestamptz | No | Last update timestamp |

### Constraints

```sql
PRIMARY KEY (id)

UNIQUE (
    rt_id,
    role_id,
    permission_id
)
```

### Foreign Keys

```sql
rt_id
    REFERENCES neighborhoods(id)

role_id
    REFERENCES roles(id)

permission_id
    REFERENCES permissions(id)
```

### Recommended Indexes

```sql
CREATE INDEX idx_rt_permission_rt
ON rt_permission_overrides(rt_id);

CREATE INDEX idx_rt_permission_role
ON rt_permission_overrides(role_id);

CREATE INDEX idx_rt_permission_permission
ON rt_permission_overrides(permission_id);
```

---

# Authorization Flow

```
User
    ↓
Role
    ↓
role_permissions
    ↓
rt_permission_overrides
    ↓
Effective Permission
```

---

# Permission Resolution

Resolution order:

1. Resolve User Role
2. Load Role Permissions
3. Apply RT Permission Overrides
4. Produce Effective Permission

RT overrides always take precedence over default Role Permissions.

---

# Constraints

The following rules must always be preserved.

- Permission codes are immutable.
- Role codes are immutable.
- Users never own permissions directly.
- Authorization must remain Role-based.
- Every permission must exist before being assigned to a Role.
- Every RT override must reference an existing Role and Permission.

---

# Notes

Permission grouping is intentionally not modeled as a database table.

Permission categories are derived from the permission code (for example, `resident.*`, `payment.*`) and are intended for UI organization and documentation only.

This keeps the authorization schema simple while allowing unlimited logical grouping in the application layer.

---

# Runtime Authorization

The following objects participate in authorization during request execution.

These objects are **runtime constructs** and are intentionally **not stored** in the database.

## AuthorizationContext

AuthorizationContext contains:

- authenticated user
- neighborhood
- assigned role
- effective permissions

AuthorizationContext is created exactly once for every request by PermissionService.

It is immutable during the lifetime of the request.

---

## RequestContext

RequestContext is the root runtime object for request processing.

It contains:

- request metadata
- localization
- AuthorizationContext

RequestContext exists only during request execution and is never persisted.

---

# Audit Logging

Operations affecting authorization-sensitive resources should generate Audit Log entries.

Typical audited operations include:

- Resident Approval
- Resident Rejection
- Payment Approval
- Payment Rejection
- Expense Creation
- Expense Update
- Expense Deletion
- Permission Override Changes

Audit Logs should contain:

- actor
- resource
- operation
- timestamp
- result

Audit records are immutable.

---

# Naming Convention

KasWarga follows the following database naming conventions.

| Object | Convention |
|----------|------------|
| Primary Key | id |
| Foreign Key | `<entity>_id` |
| Boolean | is_* |
| Timestamp | *_at |
| User Reference | *_by |

These conventions should be followed by all future database migrations.

End of Document
