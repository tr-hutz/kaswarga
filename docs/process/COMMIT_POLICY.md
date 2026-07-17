# Commit Policy

## Purpose

This document defines the commit policy for the KasWarga project.

The objective is to keep Git history clean, searchable, reviewable, and suitable for automated release generation.

This policy applies to both human contributors and AI coding agents.

---

# General Principles

Every commit should represent one logical change.

A commit must be:

- Atomic
- Reversible
- Self-contained
- Buildable

Avoid mixing unrelated changes into a single commit.

---

# Conventional Commit Format

Every commit MUST follow the Conventional Commits specification.

Format:

<type>(optional-scope): <description>

Examples:

feat(payment): add payment approval workflow

fix(resident): prevent duplicate registration

refactor(datatable): simplify pagination state

perf(api): reduce duplicate database queries

docs(database): update schema documentation

test(auth): add login integration tests

---

# Allowed Commit Types

## feat

A new business feature.

Examples:

- resident registration
- payment approval
- expense export

---

## fix

A bug fix.

Examples:

- validation issue
- incorrect calculation
- UI bug
- authorization issue

---

## refactor

Internal code improvements.

No behavior changes.

Examples:

- extract service
- simplify component
- move shared logic

---

## perf

Performance improvements.

Examples:

- optimize SQL
- reduce renders
- cache expensive computation

---

## docs

Documentation only.

Examples:

- Architecture
- Business Rules
- API
- README

---

## test

Testing only.

Examples:

- Playwright
- Unit Test
- Integration Test

---

## build

Build-related changes.

Examples:

- tsconfig
- next.config
- vite
- webpack

---

## ci

Continuous Integration.

Examples:

- GitHub Actions
- GitLab CI

---

## style

Formatting only.

No functional changes.

Examples:

- prettier
- eslint auto-fix

---

## chore

Maintenance tasks.

Examples:

- dependency updates
- cleanup
- scripts

---

## revert

Revert previous commit.

---

# Scope

Always provide a scope whenever possible.

Recommended scopes:

auth

resident

payment

expense

dashboard

ledger

activity-log

notification

registration

approval

user

role

rt

settings

datatable

ui

layout

api

database

supabase

storage

report

export

email

audit

security

performance

documentation

testing

i18n

---

# Commit Message Rules

Use imperative mood.

Good:

fix(payment): prevent duplicate approval

Bad:

fixed payment

Good:

refactor(datatable): simplify sorting

Bad:

datatable update

Avoid generic messages:

update

changes

work

temp

misc

final

done

---

# Atomic Commits

One commit should represent one logical change.

Good:

refactor(datatable): extract pagination hook

test(datatable): add pagination tests

Bad:

refactor everything

update project

---

# Large Features

Split into multiple commits.

Example:

feat(registration): add resident registration page

feat(registration): implement approval workflow

test(registration): add Playwright tests

docs(registration): update workflow

---

# AI Commit Rules

AI agents MUST:

- generate Conventional Commit messages
- prefer small commits
- avoid combining unrelated changes
- never use generic commit messages

---

# Commit Checklist

Before committing, verify:

- Project builds successfully
- TypeScript passes
- Lint passes
- Tests pass (when applicable)
- Documentation updated (if needed)
- No debug code remains
- No temporary comments remain
- No unused imports remain

---

# Examples

## Feature

feat(payment): add manual payment verification

---

## Bug Fix

fix(auth): resolve expired activation token

---

## Refactoring

refactor(ui): unify confirmation dialog

---

## Performance

perf(database): optimize resident search query

---

## Documentation

docs(architecture): update layered architecture

---

## Testing

test(payment): add approval integration test

---

## Release

chore(release): prepare v2.0.0-rc.2