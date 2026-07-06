# DATABASE_DECISIONS.md

> Project: KasWarga
>
> Version: 1.0
>
> Last Updated: July 2026

---

# Purpose

This document records important database design decisions made during the development of KasWarga.

Unlike DATABASE_SCHEMA.md, this document explains **why** a design was chosen.

Each decision has a permanent Decision ID (DD-xxx).

Decision IDs must never be reused.

---

# DD-001

## Membership instead of Direct Role Assignment

Decision

Roles are assigned through Membership instead of directly on the User.

Structure

User

↓

Membership

↓

RT

↓

Role

Reason

- Supports multiple RT memberships.
- Supports different roles in different RTs.
- Simplifies future multi-tenant expansion.

Status

Accepted

---

# DD-002

## UUID as Primary Key

Decision

Every business table uses UUID.

Reason

- Globally unique identifiers.
- Easier synchronization.
- Better support for distributed systems.
- Avoids predictable incremental IDs.

Status

Accepted

---

# DD-003

## Ledger is Append-Only

Decision

Ledger entries are never updated or deleted.

Corrections must use adjustment entries.

Reason

Financial systems require immutable transaction history.

Status

Accepted

Related

BR-050

---

# DD-004

## Payment Creates Ledger Entry

Decision

Ledger entries are created only after payment approval.

Rejected payments never affect balance.

Reason

Balance must represent verified financial transactions only.

Status

Accepted

---

# DD-005

## Dashboard Stores No Financial Data

Decision

Dashboard values are always calculated from source tables.

Reason

Avoid duplicated data.

Prevent inconsistency.

Status

Accepted

---

# DD-006

## Activity Log is Immutable

Decision

Activity logs cannot be modified.

Reason

Audit history must remain trustworthy.

Status

Accepted

---

# DD-007

## Notification is Independent

Decision

Business transactions must not depend on notification delivery.

Reason

Payment approval should succeed even if email delivery fails.

Status

Accepted

---

# DD-008

## Registration Uses Temporary Tables

Decision

Registrations are stored in request tables before approval.

Tables

- rt_registration_requests
- resident_registration_requests

Reason

Prevent creation of incomplete business entities.

Status

Accepted

---

# DD-009

## Activation Token is Separate

Decision

Activation tokens are stored separately.

Reason

Support

- expiration
- reactivation
- auditing
- future MFA

Status

Accepted

---

# DD-010

## Soft Delete Avoidance

Decision

Core financial tables do not use soft delete.

Reason

Financial records must remain permanent.

Archived records should use status flags instead.

Status

Accepted

---

# DD-011

## RT Isolation

Decision

Every business table references rt_id.

Reason

Strict tenant isolation.

Simplifies Row Level Security.

Status

Accepted

---

# DD-012

## Business Logic Outside Database

Decision

Business logic belongs to Services.

Database stores data only.

Reason

Business rules are easier to test and maintain.

Status

Accepted

---

# DD-013

## Repository Pattern

Decision

Repositories perform CRUD only.

Reason

Prevent duplicated business logic.

Status

Accepted

---

# DD-014

## English Database Naming

Decision

All tables and columns use English.

Reason

Consistency.

Developer friendliness.

Future integrations.

Status

Accepted

---

# DD-015

## JSON Metadata

Decision

Metadata fields use JSONB.

Examples

activity_logs.metadata

Reason

Flexible schema.

Future extensibility.

Status

Accepted

---

# DD-016

## Payment Status

Decision

Payment uses finite state transitions.

PENDING

↓

APPROVED

or

REJECTED

Reason

Prevent invalid transitions.

Status

Accepted

See

STATE_MACHINE.md

---

# DD-017

## Future Multi-RT

Decision

Users may belong to multiple RT.

Current implementation supports this even if UI limits it.

Reason

Future scalability.

Status

Accepted

---

# Future Decisions

Future architectural decisions should be added here.

Decision IDs must remain sequential.

---

End of Document