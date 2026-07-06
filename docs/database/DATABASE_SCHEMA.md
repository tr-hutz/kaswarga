# DATABASE_SCHEMA.md

> Project: KasWarga
>
> Version: 1.0
>
> Last Updated: July 2026

---

# Purpose

This document describes the database schema used by KasWarga.

It documents tables, relationships, indexes, constraints, and ownership.

Business meaning is documented separately in DATA_DICTIONARY.md.

---

# Naming Convention

Table

snake_case

Column

snake_case

Primary Key

id

Foreign Key

xxx_id

Timestamp

created_at

updated_at

---

# Schema Overview

Authentication

- users

Organization

- rts
- memberships
- roles

Residents

- residents

Finance

- payments
- payment_details
- expenses
- ledger_entries

Notification

- notifications

Audit

- activity_logs

Registration

- rt_registration_requests
- resident_registration_requests
- activation_tokens

---

# users

Purpose

Authentication account.

Primary Key

id

Columns

| Column | Type | Nullable |
|----------|---------|----------|
| id | uuid | No |
| email | text | No |
| full_name | text | No |
| phone_number | text | Yes |
| avatar_url | text | Yes |
| is_active | boolean | No |
| created_at | timestamptz | No |
| updated_at | timestamptz | No |

Indexes

- email (unique)

Relationships

One user

↓

Many memberships

Referenced By

- memberships

---

# rts

Purpose

RT profile.

Columns

| Column | Type |
|---------|------|
| id | uuid |
| code | text |
| name | text |
| address | text |
| bank_name | text |
| account_number | text |
| account_holder | text |
| status | text |

Indexes

code (unique)

Relationships

One RT

↓

Many Residents

↓

Many Memberships

↓

Many Payments

↓

Many Expenses

---

# memberships

Purpose

User membership inside RT.

Columns

id

user_id

rt_id

role_id

status

Relationships

Many-to-Many

Users

↓

RT

Indexes

(user_id, rt_id)

---

# residents

Purpose

Resident profile.

Columns

id

rt_id

user_id

block

street

house_number

status

Relationships

Resident

↓

Payments

---

# payments

Purpose

Resident payment.

Columns

id

resident_id

rt_id

payment_month

payment_year

amount

status

proof_url

submitted_at

approved_at

approved_by

Relationships

Resident

↓

Payment

↓

Ledger Entry

Indexes

resident_id

status

payment_month

payment_year

---

# payment_details

Purpose

Itemized billing.

Relationships

Payment

↓

Payment Details

---

# expenses

Purpose

Expense transactions.

Columns

id

rt_id

category

description

amount

expense_date

created_by

Relationships

Expense

↓

Ledger

---

# ledger_entries

Purpose

Accounting ledger.

Columns

id

rt_id

reference_type

reference_id

entry_type

amount

balance

Relationships

Payment

↓

Ledger

Expense

↓

Ledger

---

# notifications

Purpose

System notifications.

Columns

id

user_id

title

message

type

is_read

read_at

Relationships

User

↓

Notification

---

# activity_logs

Purpose

Audit trail.

Columns

id

user_id

rt_id

action

target_type

target_id

metadata

created_at

Indexes

user_id

action

created_at

---

# rt_registration_requests

Purpose

Pending RT registration.

Status

PENDING

APPROVED

REJECTED

---

# resident_registration_requests

Purpose

Pending resident registration.

---

# activation_tokens

Purpose

Account activation.

Columns

token

expires_at

used_at

---

# Relationship Summary

Users

↓

Memberships

↓

RT

↓

Residents

↓

Payments

↓

Ledger

↓

Dashboard

---

Notifications

↓

User

---

Activity Logs

↓

User

↓

Target

---

# Future Tables

visitor_logs

tool_loans

assets

vehicles

gate_access

parking

office_shuttle

---

End of Document