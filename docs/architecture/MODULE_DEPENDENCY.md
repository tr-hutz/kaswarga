# MODULE_DEPENDENCY.md

> Project: KasWarga

Version: 1.0

---

# Purpose

This document describes dependencies between business modules.

The goal is to understand the impact of changes before modifying any feature.

---

# High Level Dependency

```

Authentication

↓

Membership

↓

Permission

↓

Navigation

↓

All Features

```

---

# Resident Module

```

Resident

│

├── Payment

├── Expense (Owner)

├── Notification

├── Dashboard

└── Activity Log

```

---

# Payment Module

```

Payment

│

├── Resident

├── Ledger

├── Notification

├── Dashboard

└── Activity Log

```

Changing Payment may affect

- Ledger
- Dashboard
- Reports
- Notifications
- Activity Log

---

# Expense Module

```

Expense

│

├── Ledger

├── Dashboard

└── Activity Log

```

---

# Ledger Module

```

Ledger

│

├── Dashboard

├── Reports

└── Balance

```

Ledger should never depend on UI.

---

# Notification Module

```

Notification

│

├── Payment

├── Expense

├── Registration

├── Activation

└── Dashboard

```

Notification is a downstream module.

No business module should depend on notification responses.

---

# Activity Log Module

```

Activity Log

│

├── Payment

├── Expense

├── Resident

├── Registration

├── User

└── Authentication

```

Activity Log is append-only.

---

# Dashboard Module

```

Dashboard

│

├── Resident

├── Payment

├── Expense

└── Ledger

```

Dashboard never owns business data.

Dashboard only aggregates.

---

# RT Registration

```

Registration

↓

RT

↓

Users

↓

Membership

↓

Notification

↓

Activity Log

```

---

# Resident Registration

```

Registration

↓

Resident

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

# User Management

```

User

↓

Membership

↓

Permission

↓

Navigation

```

---

# Permission Module

```

Permission

↓

Navigation

↓

Feature Access

```

---

# Safe Changes

Examples

Updating Dashboard UI

↓

No impact on business modules

Updating Notification Template

↓

No impact on Ledger

Changing Resident Name

↓

Dashboard

↓

Reports

↓

Payment View

---

# High Risk Changes

Payment Approval

↓

Ledger

↓

Dashboard

↓

Notification

↓

Activity Log

Changing Membership

↓

Permission

↓

Navigation

↓

Entire Application

Changing Ledger Logic

↓

Balance

↓

Dashboard

↓

Reports

↓

Finance

---

# Dependency Rules

Business modules must not call each other directly.

Use

Service Layer

↓

Repository

Never

Component

↓

Supabase

---

# Circular Dependency

Never allow

Payment

↓

Ledger

↓

Payment

Dependencies must always flow in one direction.

---

# Future Modules

Tool Library

↓

Notification

↓

Activity Log

Visitor Management

↓

Notification

↓

Dashboard

Smart Locker

↓

Notification

↓

Activity Log

Office Shuttle

↓

Notification

↓

Activity Log

---

# Final Principles

Modules should remain loosely coupled.

Communication should occur through Services.

Shared functionality belongs in shared libraries.

Dependencies should always remain predictable.

---

End of Document