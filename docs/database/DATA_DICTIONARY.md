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

# Future Dictionary Entries

Visitor

Tool Loan

Asset

Parking Permit

Vehicle

Locker

---

End of Document