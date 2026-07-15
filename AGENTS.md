# AGENTS.md

# KasWarga AI Agent Guide

> This document is the entry point for every AI agent working on the KasWarga project.
>
> AI MUST read this document before analyzing, generating, modifying, or reviewing any source code.
>
> This document defines the global project rules and points AI to the relevant documentation.

---

# Stack

- Next.js (App Router)
- React
- TypeScript (strict mode)
- Supabase (Auth, Database, Storage)
- Node.js
- Tailwind CSS
- next-intl
- Playwright

---

# Core Principles

- Preserve the existing architecture.
- Prefer consistency to cleverness.
- Reuse existing implementations.
- Make the smallest possible change that solves the requested problem.
- Do not refactor unrelated code.
- Do not introduce new frameworks or libraries unless explicitly requested.

---

# Mandatory Documentation

Before writing code, identify the task type and read the relevant documentation.

## Always Read

- docs/development/CODING_STANDARD.md
- docs/development/GLOSSARY.md

## UI / Components

Read when modifying components, layouts or pages.

- docs/architecture/ARCHITECTURE.md
- docs/architecture/MODULE_DEPENDENCY.md

## Business Features

Read when changing workflows, permissions or business logic.

- docs/business/BUSINESS_RULES.md
- docs/business/PERMISSION_MATRIX.md
- docs/business/WORKFLOW.md

## Database

Read when modifying database schema, SQL, migrations or RLS.

- docs/database/DATABASE_SCHEMA.md
- docs/database/DATA_DICTIONARY.md
- docs/database/DATABASE_DECISIONS.md
- docs/database/RLS_POLICY.md

## API

Read when creating or modifying APIs.

- docs/api/API_CONVENTION.md

Never modify code before reading the relevant documentation.

---

# Framework Rules

When implementing framework-specific functionality:

- Prefer official framework documentation.
- Never assume APIs from memory.
- Verify APIs before introducing new patterns.
- Follow current Next.js App Router conventions.

---

# Architecture

Follow the layered architecture.

Business Features

↓

Common Components

↓

UI Components

↓

Third-party Libraries

Business modules MUST NOT import third-party UI libraries directly.

---

# Reuse Existing Code

Before creating any:

- Component
- Hook
- Service
- Repository
- Dialog
- Table
- Form
- Utility
- Type
- Interface

Search the project first.

Reuse existing implementations whenever possible.

Avoid duplicate functionality.

---

# UI Component Layer

Business modules MUST import UI components only from:

```
@/components/ui
```

Business modules MUST NOT import UI libraries directly.

Examples:

NOT ALLOWED

```
@headlessui/react
@radix-ui/*
lucide-react
react-icons
react-hot-toast
```

Those libraries should only be imported inside:

```
components/ui
```

---

# Common Components

Reusable business-independent components belong in:

```
components/common
```

Examples:

- DataTable
- SearchBox
- FilterBar
- Pagination
- Toolbar
- EmptyState
- LoadingState
- ErrorState

Do not duplicate them inside feature modules.

---

# Layout Components

Application layouts belong in:

```
components/layout
```

Examples:

- AppShell
- Sidebar
- Header
- Footer
- Breadcrumb

Feature modules should not implement their own layouts.

---

# Generic Data Table

All table-based pages should use the shared DataTable.

Location:

```
components/common/data-table
```

Do not create feature-specific table implementations unless explicitly required.

Prefer:

- server-side pagination
- server-side filtering
- server-side sorting
- server-side search

---

# Business Logic

Business logic belongs inside feature modules.

UI Components MUST NEVER:

- access Supabase
- execute SQL
- implement business rules
- perform permission checks

UI Components receive data via props only.

---

# Supabase Usage

Use centralized clients only.

```
lib/supabaseClient.ts
lib/supabaseServer.ts
```

Always:

- validate inputs
- use typed responses
- handle null responses
- isolate query logic

Never:

- query Supabase directly from UI
- duplicate query logic

---

# Data & Error Handling

Always:

- handle null
- handle undefined
- handle empty arrays

Prefer safe defaults.

UI should not crash because data is missing.

Throw exceptions only when appropriate inside service layer.

---

# Performance

Avoid:

- N+1 queries
- duplicate fetches
- fetching unnecessary columns
- repeated renders

Prefer:

- pagination
- lazy loading
- caching
- memoization where appropriate
- server-side filtering

---

# Feature Flags

If feature flags are used:

- use configuration
- never hardcode flags
- keep features isolated

---

# TypeScript

Strict mode is required.

Avoid:

```
any
```

Prefer:

- interface
- generic
- utility types
- discriminated unions where appropriate

---

# Naming Convention

All source code MUST use English.

Including:

- folders
- files
- variables
- functions
- interfaces
- enums
- database objects
- migrations

Human-facing text uses i18n.

Never hardcode UI strings.

---

# Domain Terminology

Always follow:

```
docs/development/GLOSSARY.md
```

Never invent new business terminology.

If introducing a new domain concept:

Update GLOSSARY.md first.

---

# Permissions

Never hardcode role names.

Follow:

```
docs/business/PERMISSION_MATRIX.md
```

Always use centralized authorization.

---

# Activity Log

Whenever a business action changes system state,

evaluate whether an Activity Log entry should be created.

Examples:

- Create
- Update
- Delete
- Approve
- Reject
- Login
- Registration
- Payment
- Expense
- Resident

---

# Notifications

Whenever a business action affects another user,

evaluate whether a notification should be created.

---

# Testing

Whenever behavior changes,

evaluate whether Playwright tests require updates.

Prefer updating existing tests rather than removing them.

---

# Documentation

Whenever changing:

- architecture
- database
- API
- business workflow

evaluate whether these documents need updates:

- ARCHITECTURE.md
- DATABASE_SCHEMA.md
- BUSINESS_RULES.md
- API_CONVENTION.md
- GLOSSARY.md

Documentation should remain synchronized with the implementation.

---

# File Conventions

Components

```
PascalCase.tsx
```

Hooks

```
useSomething.ts
```

Services

```
camelCase.ts
```

Constants

```
UPPER_SNAKE_CASE
```

---

# Commands

Development

```
npm run dev
```

Build

```
npm run build
```

Lint

```
npm run lint
```

Tests

```
npm test
```

Playwright

```
npm run test:e2e
```

---

# Constraints

Never modify:

- generated files
- environment configuration
- migration history

Never:

- introduce unnecessary libraries
- change project structure without reason
- perform unrelated refactoring

---

# Security

Never expose:

- Service Role Key
- private environment variables
- secrets

Always use server-side Supabase client for sensitive operations.

---

# Completion Checklist

Before completing any task verify:

- Existing components reused
- Coding Standard followed
- Glossary followed
- Layered architecture preserved
- No forbidden imports
- Business rules respected
- Permissions respected
- Tests updated if necessary
- Documentation updated if necessary

---

# Expected Output

Produce code that is:

- clean
- minimal
- production-ready
- consistent
- readable
- maintainable

Always preserve the existing project architecture.