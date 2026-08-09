# WORKFLOW.md

> Project: KasWarga
>
> Version: 1.0
>
> Last Updated: July 2026

---

# 1. Purpose

This document describes the business workflows implemented in KasWarga.

The objectives are:

- Document business processes
- Define module interactions
- Simplify onboarding
- Support QA testing
- Support AI-assisted development

Each workflow is identified by a unique Workflow ID.

---

# Workflow Index

| ID | Workflow |
|----|----------|
| WF-001 | User Authentication |
| WF-002 | RT Registration |
| WF-003 | Resident Registration |
| WF-004 | Payment Submission |
| WF-005 | Payment Approval |
| WF-006 | Expense Recording |
| WF-007 | Notification |
| WF-008 | Activity Log |
| WF-009 | User & Role Management |
| WF-010 | Dashboard Refresh |

---

# WF-001 User Authentication

Purpose

Authenticate users into the system.

Flow

```

User

↓

Login

↓

Supabase Auth

↓

Verify Membership

↓

Load Permissions

↓

Generate Navigation

↓

Dashboard

```

Output

- Authenticated Session
- Active Membership
- Dynamic Navigation

Activity Log

LOGIN

Notifications

None

---

# WF-002 RT Registration

Purpose

Register a new RT into the system.

Actor

Public User

Flow

```

Registration Form

↓

Validation

↓

Pending Registration

↓

Super Administrator Review

├── Reject

└── Approve

↓

Create RT

↓

Create Chair

↓

Create Administrator

↓

Create Treasurer

↓

Create Memberships

↓

Generate Activation Tokens

↓

Send Activation Email

↓

Completed

```

Generated Records

- RT
- Users
- Memberships
- Activity Log
- Notifications

Activity Log

RT_REGISTER_REQUEST

RT_REGISTER_APPROVED

RT_REGISTER_REJECTED

---

# WF-003 Resident Registration

Purpose

Register a resident into an existing RT.

Actor

Public User

Flow

```

Registration Form

↓

Validation

↓

Find RT

↓

Pending Registration

↓

RT Chair / Administrator

├── Reject

└── Approve

↓

Send Activation Email

↓

Resident clicks activation link

↓

Claim imported resident row?

├── Yes (matching block + house_number, no existing membership) → Update & reuse existing row

└── No → Create new Resident row

↓

Create User

↓

Membership

↓

Activation Token marked used

↓

Completed

```

Notes

- Claiming an imported resident row requires a `block` + `house_number` match (case-insensitive) within the same RT, and the existing row must not yet be linked to any membership.
- If the existing row is matched, its `name`, `email`, and `phone` are updated from the registration request. No duplicate resident row is created.
- See BR-026, BR-027.

Generated Records

- Resident (created or claimed from import)
- User
- Membership
- Notification

---

# WF-004 Payment Submission

Purpose

Allow residents to submit payment proof.

Actor

Resident

Flow

```

Upload Payment Proof

↓

Validation

↓

Create Payment

↓

Status

PENDING

↓

Treasurer Notification

```

Output

Payment Status

Pending

Generated Records

Payment

Notification

Activity Log

---

# WF-005 Payment Approval

Purpose

Approve resident payment.

Actor

Treasurer

Flow

```

Pending Payment

↓

Review

├── Reject

└── Approve

↓

Create Ledger Entry

↓

Update Dashboard

↓

Notification

↓

Activity Log

↓

Completed

```

Business Rule

Approved payments cannot be edited.

Generated Records

Ledger Entry

Notification

Activity Log

Dashboard Update

---

# WF-006 Expense Recording

Purpose

Record RT expenses.

Actor

Treasurer

Flow

```

Expense Form

↓

Validation

↓

Create Expense

↓

Create Ledger Entry

↓

Dashboard Update

↓

Activity Log

```

Output

Updated Balance

---

# WF-007 Notification

Purpose

Notify users of important events.

Trigger Examples

- Payment Approved
- Payment Rejected
- Registration Approved
- Registration Rejected
- Account Activated

Flow

```

Business Event

↓

Notification Service

↓

Database

↓

Email (future)

↓

Dashboard Badge

↓

Read / Unread

```

---

# WF-008 Activity Log

Purpose

Record all important business events.

Flow

```

Business Action

↓

Activity Service

↓

Activity Log Table

↓

Audit Trail

```

Examples

LOGIN

CREATE_PAYMENT

APPROVE_PAYMENT

CREATE_EXPENSE

UPDATE_RESIDENT

---

# WF-009 User & Role Management

Purpose

Manage user accounts and permissions.

Actor

Super Administrator

RT Administrator

Flow

```

Create User

↓

Assign Role

↓

Create Membership

↓

Generate Activation

↓

Send Email

↓

Completed

```

Role Changes

↓

Update Membership

↓

Refresh Permissions

↓

Activity Log

---

# WF-010 Dashboard Refresh

Purpose

Display latest financial summary.

Sources

Payments

↓

Expenses

↓

Ledger

↓

Residents

↓

Dashboard Cards

↓

Charts

↓

Statistics

Dashboard should never store calculated values.

---

# Module Dependency

```

Payment

↓

Ledger

↓

Notification

↓

Activity Log

```

---

```

Expense

↓

Ledger

↓

Dashboard

↓

Activity Log

```

---

```

Resident Registration

↓

User

↓

Membership

↓

Notification

↓

Activity Log

```

---

```

RT Registration

↓

RT

↓

Users

↓

Memberships

↓

Notification

↓

Activity Log

```

---

# General Workflow Principles

Every important business action should:

✓ Validate

↓

✓ Authorize

↓

✓ Execute Business Logic

↓

✓ Update Database

↓

✓ Generate Notification (if applicable)

↓

✓ Generate Activity Log

↓

✓ Refresh Dashboard (if applicable)

---

# Error Handling

If a workflow fails

↓

Rollback transaction

↓

Log error

↓

Return predictable response

↓

Display user-friendly message

---

# Future Workflows

Planned workflows

- Visitor Check-in
- Smart Locker
- Tool Borrowing
- Vehicle Registration
- Parking Access
- Office Shuttle
- Asset Maintenance

All future workflows must follow this document.

---

End of Document