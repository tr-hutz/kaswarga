# MIGRATION_GUIDE.md

> Project: KasWarga
>
> Version: 1.0
>
> Last Updated: July 2026

---

# Purpose

This guide defines how database schema changes are created, reviewed, tested, and deployed.

Every schema modification must follow this process.

---

# Principles

Database changes must be

- repeatable
- reversible
- reviewed
- versioned

Never modify production manually.

---

# Migration Workflow

```

Requirement

↓

Database Design

↓

Review

↓

Migration Script

↓

Local Testing

↓

RLS Verification

↓

Seed Verification

↓

Pull Request

↓

Production

```

---

# Migration Naming

Use timestamp format.

Example

```
202607081030_create_memberships.sql

202607091200_add_activity_logs.sql

202607101000_create_notifications.sql
```

---

# One Purpose Per Migration

Good

```
Create residents table
```

Bad

```
Create residents

Update payments

Remove ledger columns

Add indexes
```

---

# Safe Migration Order

1.

Create table

↓

2.

Add indexes

↓

3.

Add foreign keys

↓

4.

Enable RLS

↓

5.

Create Policies

↓

6.

Seed Data

---

# Never Do

❌ Edit existing migration.

❌ Delete migration history.

❌ Run SQL directly in production.

❌ Disable RLS.

---

# Rollback Strategy

Every destructive migration must include rollback instructions.

Example

```
DROP TABLE ...

↓

Backup

↓

Rollback SQL
```

---

# Seed Data

Seed only

- Roles
- Permissions
- System Settings
- Categories

Never seed

Resident data

Payment data

Financial data

---

# Production Checklist

Before deployment

✓ Backup database

✓ Review migration

✓ Review indexes

✓ Review foreign keys

✓ Review RLS

✓ Run tests

✓ Verify dashboard

---

# Performance Checklist

Large table changes should

- create indexes first
- avoid long locks
- batch data updates

---

# Data Migration

Separate schema migration from data migration.

Schema

↓

Migration

Data

↓

Script

Never mix both unnecessarily.

---

# Foreign Keys

Always define

ON DELETE

ON UPDATE

explicitly.

Avoid database defaults.

---

# Indexes

Review indexes after

- new foreign keys
- new search columns
- reporting features

Avoid duplicate indexes.

---

# Constraints

Prefer database constraints over application assumptions.

Examples

UNIQUE

CHECK

FOREIGN KEY

NOT NULL

---

# RLS

Every new table

↓

Enable RLS

↓

Create Policies

↓

Test Policies

Migration is incomplete without RLS.

---

# Testing

After every migration

Verify

- Authentication
- Registration
- Payment
- Ledger
- Notification
- Activity Log

---

# Code Review Checklist

Reviewer should verify

- naming
- constraints
- indexes
- rollback
- RLS
- performance
- documentation

---

# Production Deployment

Order

1.

Backup

↓

2.

Migration

↓

3.

Seed

↓

4.

Smoke Test

↓

5.

Application Deployment

↓

6.

Monitoring

---

# Documentation

Every migration affecting architecture must update

- DATABASE_SCHEMA.md
- DATA_DICTIONARY.md
- ERD.md
- DATABASE_DECISIONS.md

If business logic changes

Update

BUSINESS_RULES.md

---

# Final Principles

Schema changes are permanent.

Design first.

Migrate second.

Deploy last.

---

End of Document