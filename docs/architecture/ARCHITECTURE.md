# ARCHITECTURE.md

> Project: KasWarga
>
> Version: 1.0
>
> Last Updated: July 2026

---

# 1. Overview

KasWarga is a multi-tenant residential community management platform built for Indonesian neighborhoods (RT/RW).

The application centralizes resident management, payment collection, accounting, notifications, activity auditing, and role-based administration into a single platform.

The system is designed to scale from a single RT into multiple residential communities while keeping every tenant completely isolated.

---

# 2. Design Principles

KasWarga follows these core principles:

- Feature-first architecture
- Multi-tenant by design
- Secure by default
- Role-based access control
- Audit everything
- Minimal business logic inside UI
- Reusable UI components
- Service-oriented business logic
- Database as the single source of truth
- Clean separation between presentation and business logic

---

# 3. Technology Stack

| Layer | Technology |
|--------|------------|
| Framework | Next.js (App Router) |
| Language | JavaScript (planned migration to TypeScript) |
| Styling | Tailwind CSS |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Authorization | Supabase RLS + RBAC |
| Storage | Supabase Storage |
| State | React Hooks |
| Deployment | Vercel (recommended) |

---

# 4. High Level Architecture

```

Browser

│

▼

Next.js App Router

│

├── Server Components

├── Client Components

└── Route Handlers / Server Actions

│

▼

Service Layer

│

▼

Repository Layer

│

▼

Supabase

│

├── PostgreSQL

├── Authentication

├── Storage

└── Realtime (Future)

```

---

# 5. Project Structure

The project follows a Feature-First Architecture.

```

app/
api/

features/
auth/
dashboard/
resident/
payment/
expense/
ledger/
notification/
activity/
registration/
rt/
users/
roles/

components/
ui/
layout/

lib/
supabase/
utils/
constants/

types/

styles/

public/

docs/

```

---

# 6. Layer Architecture

Each feature should follow this layered approach.

```

UI Components

↓

Hooks

↓

Services

↓

Repositories

↓

Supabase

```

Responsibilities

## Components

Responsible only for:

- Rendering UI
- Receiving props
- Triggering events

Must NOT contain:

- SQL
- Business rules
- Authorization

---

## Hooks

Responsible for:

- UI state
- Loading
- Pagination
- Search
- Filtering

Must NOT:

- Access database directly

---

## Services

Responsible for:

- Business logic
- Validation
- Transactions
- Activity logging
- Notifications

Example:

Approve Payment

↓

Create Ledger Entry

↓

Create Notification

↓

Create Activity Log

---

## Repository

Responsible only for:

- Database access

Repository should never:

- Send notifications
- Perform business validation
- Know UI

---

# 7. Multi-Tenant Architecture

KasWarga supports multiple RTs.

Every business data belongs to exactly one RT.

```

RT

├── Residents

├── Payments

├── Expenses

├── Ledger

├── Notifications

├── Activity Logs

└── Memberships

```

All tables should contain:

- rt_id

unless they are global tables.

---

# 8. Authentication

Authentication uses Supabase Auth.

Supported authentication:

- Email + Password
- Email Activation
- Password Reset

Future:

- Google Login
- OTP Login

---

# 9. Authorization

Authorization uses RBAC.

Roles:

- Super Administrator
- RT Chair
- RT Administrator
- Treasurer
- Resident

Navigation is dynamically generated based on permissions.

---

# 10. Permission Model

Super Administrator

Can:

- Manage RT
- Manage Users
- Approve RT Registration

Cannot:

- View financial data
- View ledger
- Approve payments

RT Chair

Can:

- View dashboard
- Approve resident registration
- View reports

RT Administrator

Can:

- Manage residents
- Approve resident registration
- Manage users

Treasurer

Can:

- Manage payments
- Manage expenses
- Manage ledger
- Approve payment

Resident

Can:

- View own dashboard
- Submit payment
- Receive notifications

---

# 11. Business Modules

Current modules

- Authentication
- Dashboard
- Residents
- Payments
- Expenses
- Ledger
- Notifications
- Activity Log
- RT Registration
- Resident Registration
- Users
- Roles

Future modules

- Tool Library
- Smart Locker
- Automatic Gate
- Office Shuttle
- Visitor Management
- Asset Management

---

# 12. Payment Workflow

```

Resident

↓

Submit Payment

↓

Pending

↓

Treasurer Review

├── Reject

└── Approve

↓

Ledger Entry

↓

Notification

↓

Activity Log

```

---

# 13. RT Registration Workflow

```

Public Registration

↓

Pending

↓

Super Admin Approval

↓

Create RT

↓

Create Users

↓

Create Memberships

↓

Send Activation Email

↓

Account Activation

↓

Login

```

---

# 14. Resident Registration Workflow

```

Public Registration

↓

Pending

↓

Chair/Admin Approval

↓

Create User

↓

Create Resident

↓

Membership

↓

Activation

↓

Login

```

---

# 15. Activity Log

Every important action must be recorded.

Examples

- LOGIN
- CREATE_PAYMENT
- APPROVE_PAYMENT
- CREATE_EXPENSE
- UPDATE_RESIDENT
- RT_REGISTER_APPROVED

Activity log should contain

- Actor
- Target
- Action
- Metadata
- Timestamp

---

# 16. Notification System

Notifications are generated by business events.

Examples

Payment Approved

↓

Notification

↓

Email

↓

Dashboard Badge

↓

Read / Unread

---

# 17. Security Principles

KasWarga follows a defense-in-depth strategy.

Security layers

- Authentication
- RBAC
- RLS
- Server-side validation
- Audit Log

Never trust client input.

---

# 18. Database Principles

- UUID as primary key
- snake_case table names
- Foreign key constraints
- Soft delete (recommended)
- Audit columns
- RLS on business tables

---

# 19. Coding Philosophy

Business logic belongs in Services.

Database logic belongs in Repositories.

Components should remain as dumb as possible.

Never duplicate business rules.

---

# 20. Error Handling

Each page should support

- Loading State
- Empty State
- Error State

Every service should return predictable results.

---

# 21. Scalability

The architecture is designed to support

- Thousands of residents
- Hundreds of RTs
- Multiple administrators
- Additional business modules

without changing the core architecture.

---

# 22. Future Improvements

Planned improvements

- Full TypeScript migration
- Repository pattern refinement
- DTO layer
- Domain Models
- Mapper layer
- React Email
- Queue-based notifications
- Background jobs
- Playwright E2E Testing
- Storybook
- TailAdmin migration

---

# 23. Architecture Goals

KasWarga aims to become a maintainable, scalable and secure community management platform.

Every new feature should follow the same architecture defined in this document.

Deviation from these principles should be documented and justified during code review.

---

End of Document