# TailAdmin Migration Plan

## Purpose

This document defines the official migration plan from the current KasWarga presentation layer to TailAdmin.

The objective is to modernize the user interface while preserving the existing architecture, business logic, workflows, database contracts, API contracts, and security model.

TailAdmin is considered a replacement of the Presentation Layer only.

---

# Current Baseline

Current Release Candidate:

**KasWarga v2.0.0-rc.3**

Completed milestones:

- Feature Complete
- Architecture Freeze
- Production Hardening
- Documentation Complete
- Generic DataTable
- UI Component Layer
- Database Migration (English)
- TypeScript (Strict)
- next-intl
- Playwright
- Gate Review
- Pre-Migration Readiness

This version is the official baseline for the migration.

---

# Migration Objectives

The migration should achieve:

- Modern UI
- Better user experience
- Improved visual consistency
- Better responsiveness
- Easier future maintenance

Without changing application behavior.

---

# Scope

## Included

- Layout
- Navigation
- Theme
- Colors
- Typography
- Icons
- Components
- Responsive layout
- Animations
- TailAdmin styling

## Excluded

- Business Rules
- Services
- Database
- API
- Permissions
- Activity Log
- Translation Keys
- Workflow
- Validation Logic

---

# Architecture Principle

The migration follows this rule:

Business Layer

↓

Service Layer

↓

Presentation Layer

Only the Presentation Layer may change.

---

# Frozen Contracts

The following contracts are frozen.

## Database

- Table names
- Column names
- RLS
- Functions
- Triggers

## Services

- Public APIs
- Method names
- Return types

## Hooks

- Public interfaces

## Generic Components

- DataTable API
- Pagination API
- Search API

## Permissions

Permission codes are frozen.

## Translation

Translation keys are frozen.

## Activity Log

Action names are frozen.

---

# Migration Strategy

Migration should be incremental.

Never migrate the whole application at once.

Each sprint should produce a working application.

---

# Sprint Plan

## Sprint 1

TailAdmin Foundation

Deliverables

- Install TailAdmin
- Configure theme
- Configure typography
- Configure color palette
- Configure spacing
- Configure icon system

Validation

- Build passes
- TypeScript passes

---

## Sprint 2

Application Layout

Components

- AppShell
- Sidebar
- Header
- Footer
- Breadcrumb
- Navigation

Validation

- Responsive layout
- Navigation works
- Playwright passes

---

## Sprint 3

Shared UI Components

Components

- Button
- Card
- Badge
- Alert
- Input
- Textarea
- Checkbox
- Select
- Switch
- Modal
- Dialog
- Tooltip
- Avatar
- Dropdown

Validation

- Existing APIs unchanged
- Existing usage unchanged

---

## Sprint 4

Generic Components

Components

- DataTable
- Pagination
- Toolbar
- SearchBox
- FilterBar
- RowsPerPage
- EmptyState
- LoadingState
- ErrorState
- ConfirmDialog
- ExportButton

Validation

Existing Playwright DataTable tests must pass.

---

## Sprint 5

Dashboard

Migrate:

- Summary Cards
- Charts
- Quick Actions
- Dashboard Layout

Business calculations must remain unchanged.

---

## Sprint 6

Business Modules

Migration order

1. Resident

2. Payment

3. Expense

4. Ledger

5. Notifications

6. Activity Log

7. User

8. Role

9. RT

10. Settings

Validation after every module.

---

## Sprint 7

Visual Polish

Review

- Typography
- Alignment
- White space
- Responsive layout
- Hover
- Focus
- Animation

---

## Sprint 8

Final QA

Run

- TypeScript
- ESLint
- Production Build
- Playwright
- Visual Regression

---

# Acceptance Criteria

Migration is successful only if:

- No business logic changes
- No workflow changes
- No service changes
- No database changes
- No permission changes
- No translation key changes
- No Activity Log changes
- Generic DataTable behavior unchanged
- Build passes
- TypeScript passes
- ESLint passes
- Playwright passes

---

# Visual Regression Checklist

Verify:

- Dashboard
- Resident List
- Resident Form
- Payment List
- Payment Detail
- Expense List
- Expense Form
- Activity Log
- Notifications
- Users
- Roles
- RT
- Settings
- Login
- Registration
- Dialogs
- DataTable
- Mobile Layout
- Tablet Layout

---

# Performance Requirements

TailAdmin migration must not introduce measurable performance degradation.

Target:

- Bundle size increase should be minimal.
- Existing pagination behavior preserved.
- No unnecessary Client Components.
- Existing Server Components remain Server Components.
- No unnecessary re-rendering.

---

# Rollback Strategy

If migration introduces major regressions:

1. Stop the migration.

2. Revert the current sprint.

3. Return to the latest stable tag:

v2.0.0-rc.3

4. Fix the issue before continuing.

Never continue migration on an unstable baseline.

---

# Branch Strategy

Main branch remains stable.

Recommended workflow:

main

↓

feature/tailadmin-foundation

↓

feature/tailadmin-layout

↓

feature/tailadmin-components

↓

feature/tailadmin-dashboard

↓

feature/tailadmin-resident

↓

...

Each sprint should have its own Pull Request.

---

# Definition of Done

A migration sprint is considered complete only if:

- Business behavior unchanged.
- Existing tests pass.
- No regression found.
- Responsive layout verified.
- Accessibility preserved.
- Documentation updated (if necessary).
- Code follows CODING_STANDARD.md.
- AGENTS.md rules are respected.
- Conventional Commit used.
- Pull Request reviewed.

---

# Out of Scope

The following are NOT part of this migration:

- New features
- Database redesign
- Service refactoring
- Repository refactoring
- Workflow redesign
- Permission redesign
- Translation redesign
- Business Rule changes

These tasks belong to future releases.

---

## Tailwind Compatibility

KasWarga uses Tailwind CSS v4.

TailAdmin should be adapted to Tailwind CSS v4.

Downgrading Tailwind is prohibited.

Do not replace the project's Tailwind configuration.

Instead:

- adapt TailAdmin components
- update deprecated utilities
- preserve existing Tailwind v4 architecture

---

# Migration Rules for AI Agents

During TailAdmin migration, AI agents MUST:

- Read AGENTS.md before generating code.
- Read DESIGN_SYSTEM.md before modifying components.
- Follow CODING_STANDARD.md.
- Preserve all frozen contracts.
- Never refactor unrelated modules.
- Keep commits atomic and follow COMMIT_POLICY.md.
- Update documentation only when implementation changes.
- Stop and report if a requested change requires modifying the Business Layer or Database Layer.

---

# Success Criteria

The migration is considered complete when:

- TailAdmin fully replaces the existing presentation layer.
- All business functionality behaves identically.
- UI consistency is significantly improved.
- Performance remains within acceptable limits.
- Existing automated tests pass.
- The architecture separation between Presentation Layer and Business Layer remains intact.

Upon successful completion, the project may be released as:

**KasWarga v2.0.0**

