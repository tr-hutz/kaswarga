# RLS_POLICY.md

> Project: KasWarga
>
> Version: 1.0
>
> Last Updated: July 2026

---

# Purpose

This document defines the Row Level Security (RLS) policies for every database table in KasWarga.

RLS is the last line of defense against unauthorized data access.

Application-level authorization does NOT replace RLS.

---

# Security Principles

1. RLS must be enabled on every business table.
2. Every query is evaluated against Membership.
3. Super Administrator bypasses tenant isolation only for system management.
4. Financial data is always isolated by RT.
5. Users may only access resources belonging to their active Membership.

---

# Authorization Model

```

User

↓

Membership

↓

Role

↓

Permission

↓

RLS

↓

Database

```

---

# Helper Functions

Recommended helper functions

```
current_user_id()

current_membership_id()

current_rt_id()

current_role()

is_super_admin()

has_permission(permission_name)
```

Business logic should NOT be duplicated inside RLS.

RLS only determines visibility and write access.

---

# users

Purpose

Authentication profile.

SELECT

User may read only own profile.

UPDATE

User may update own profile.

DELETE

Not allowed.

INSERT

Supabase Auth only.

---

# memberships

SELECT

User may read own memberships.

Chair/Admin may read memberships within the same RT.

Super Administrator may read all.

UPDATE

Super Administrator only.

DELETE

Super Administrator only.

---

# rts

SELECT

Members may view their own RT.

Super Administrator may view all.

UPDATE

Chair

Administrator

Super Administrator

DELETE

Not allowed.

Archive instead.

---

# residents

SELECT

Resident

Own profile only.

Chair/Admin/Treasurer

All residents in same RT.

Super Administrator

No access to resident data.

Reason

Super Administrator must not access RT business data.

INSERT

Chair

Administrator

UPDATE

Chair

Administrator

Resident

Own contact information only.

DELETE

Chair

Administrator

---

# payments

SELECT

Resident

Own payments.

Treasurer

All payments in own RT.

Chair/Admin

Read-only.

Super Administrator

No access.

INSERT

Resident only.

UPDATE

Treasurer

Approval only.

Resident

Cannot modify approved payment.

DELETE

Never.

Payments are immutable.

---

# payment_details

Visibility follows parent payment.

---

# expenses

SELECT

Treasurer

Chair

Administrator

Same RT only.

Resident

Not allowed.

Super Administrator

Not allowed.

INSERT

Treasurer only.

UPDATE

Treasurer only.

DELETE

Never.

---

# ledger_entries

SELECT

Treasurer

Chair

Administrator

Same RT only.

Resident

Not allowed.

Super Administrator

Not allowed.

INSERT

System only.

UPDATE

Never.

DELETE

Never.

---

# notifications

SELECT

Owner only.

INSERT

System only.

UPDATE

Owner may mark as READ.

DELETE

Owner only.

---

# activity_logs

SELECT

Super Administrator

All.

Chair/Admin/Treasurer

Own RT only.

Resident

None.

INSERT

System only.

UPDATE

Never.

DELETE

Never.

---

# rt_registration_requests

SELECT

Super Administrator

INSERT

Public

UPDATE

Super Administrator

DELETE

Never.

---

# resident_registration_requests

SELECT

Chair/Admin

Matching RT.

INSERT

Public.

UPDATE

Chair/Admin

DELETE

Never.

---

# activation_tokens

SELECT

Owner only.

INSERT

System.

UPDATE

System.

DELETE

Expired cleanup job only.

---

# Storage Policies

Payment Proof

Resident

Upload own file.

Treasurer

Read.

Others

Denied.

---

Avatar

Owner

Upload.

Owner

Read.

---

# Service Role

Only background jobs may use Service Role.

Examples

- Email sender
- Cleanup jobs
- Scheduled tasks
- Data migration

Never expose Service Role Key to frontend.

---

# Testing Checklist

Verify

✓ Resident cannot read another resident.

✓ Treasurer cannot access another RT.

✓ Chair cannot approve payment.

✓ Super Administrator cannot access financial records.

✓ Activity Logs are immutable.

✓ Ledger Entries are immutable.

✓ Notifications are owner-only.

---

# RLS Principles

RLS protects data.

Business rules remain inside Services.

Never disable RLS in production.

Every new table must define RLS before release.

---

End of Document