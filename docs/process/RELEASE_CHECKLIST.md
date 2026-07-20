# Release Checklist

## Purpose

This document defines the mandatory release validation process for the KasWarga project.

Its purpose is to ensure every release is:

- Stable
- Secure
- Fully tested
- Properly documented
- Ready for production deployment

This checklist applies to all releases, including:

- Release Candidates (RC)
- Stable Releases
- Patch Releases
- Minor Releases
- Major Releases

---

# Release Workflow

The standard release workflow is:

```

Feature Development

↓

Feature Complete

↓

Gate Review

↓

Production Hardening

↓

Release Candidate

↓

Release Candidate Validation

↓

Deployment Readiness

↓

Production Deployment

↓

Post Deployment Verification

↓

Release Tag

```

---

# General Rules

Before every release:

- No unresolved Critical issues.
- No unresolved High severity issues.
- All automated tests must pass.
- Build must succeed.
- Documentation must be up to date.
- Release notes must be prepared.
- Changelog must be updated.

Never release directly from an unstable branch.

---

# 1. Source Control

Verify:

- [ ] All intended changes are committed.
- [ ] No temporary commits remain.
- [ ] No "WIP" commits remain.
- [ ] Conventional Commits are used.
- [ ] Branch is synchronized.
- [ ] Pull Request has been reviewed.
- [ ] Merge conflicts resolved.
- [ ] Correct release branch selected.

---

# 2. Code Quality

Verify:

- [ ] TypeScript passes.
- [ ] ESLint passes.
- [ ] No compilation errors.
- [ ] No debug code remains.
- [ ] No console.log statements (except intentional logging).
- [ ] No TODO/FIXME left for release scope.
- [ ] No unused imports.
- [ ] No dead code.

---

# 3. Functional Validation

Verify:

- [ ] Authentication
- [ ] Dashboard
- [ ] Resident
- [ ] Resident Registration
- [ ] RT Registration
- [ ] Payment
- [ ] Expense
- [ ] Ledger
- [ ] Reports
- [ ] Notifications
- [ ] Activity Log
- [ ] Users
- [ ] Roles
- [ ] Settings

Confirm:

- [ ] CRUD operations work.
- [ ] Validation works.
- [ ] Dialogs work.
- [ ] Search works.
- [ ] Pagination works.
- [ ] Sorting works.
- [ ] Filtering works.
- [ ] Export works.

---

# 4. Navigation

Verify:

- [ ] Sidebar
- [ ] Header
- [ ] Breadcrumb
- [ ] Quick Actions
- [ ] Deep Links
- [ ] Back Navigation

Confirm:

- [ ] No missing pages.
- [ ] No broken routes.
- [ ] No duplicate navigation items.
- [ ] Active menu state is correct.

---

# 5. Permission Validation

Verify all supported roles.

Examples:

- [ ] Super Admin
- [ ] RT Administrator
- [ ] Treasurer
- [ ] Resident

Confirm:

- [ ] Correct menu visibility.
- [ ] Correct route protection.
- [ ] Correct action permissions.
- [ ] Unauthorized access blocked.

---

# 6. Theme Validation

Verify:

- [ ] Light Theme
- [ ] Dark Theme
- [ ] System Theme

Confirm:

- [ ] Theme persistence.
- [ ] Correct colors.
- [ ] Correct contrast.
- [ ] Charts render correctly.
- [ ] Dialogs render correctly.
- [ ] DataTable renders correctly.

---

# 7. Responsive Validation

Verify:

- [ ] Desktop
- [ ] Tablet
- [ ] Mobile

Review:

- [ ] Layout
- [ ] Forms
- [ ] Tables
- [ ] Dialogs
- [ ] Sidebar
- [ ] Navigation

---

# 8. Accessibility

Verify:

- [ ] Keyboard navigation.
- [ ] Focus visibility.
- [ ] ARIA labels.
- [ ] Dialog focus trap.
- [ ] Escape handling.
- [ ] Tab order.
- [ ] Color contrast.

---

# 9. Automated Testing

Run:

- [ ] Unit Tests
- [ ] Integration Tests
- [ ] Playwright Tests

Confirm:

- [ ] All tests pass.

---

# 10. Performance

Review:

- [ ] Build size.
- [ ] Bundle size.
- [ ] Large client components.
- [ ] DataTable performance.
- [ ] Pagination performance.
- [ ] Database queries.
- [ ] Rendering performance.

Confirm:

- [ ] No unacceptable regression.

---

# 11. Security

Verify:

- [ ] No exposed secrets.
- [ ] Environment variables configured correctly.
- [ ] Service Role keys are server-only.
- [ ] RLS policies validated.
- [ ] Authentication works.
- [ ] Authorization works.
- [ ] File uploads validated.
- [ ] Input validation verified.

---

# 12. Database

Verify:

- [ ] Latest migration applied.
- [ ] Schema matches documentation.
- [ ] RLS enabled where required.
- [ ] Functions validated.
- [ ] Triggers validated.
- [ ] Seed data verified (if applicable).

---

# 13. Documentation

Verify:

- [ ] README updated.
- [ ] Architecture updated (if applicable).
- [ ] Business Rules updated (if applicable).
- [ ] Database documentation updated.
- [ ] API documentation updated.
- [ ] Changelog updated.
- [ ] Release notes prepared.

---

# 14. Deployment Readiness

Verify:

- [ ] Production environment variables configured.
- [ ] Vercel configuration verified.
- [ ] Build command verified.
- [ ] Node.js version verified.
- [ ] Redirects verified.
- [ ] Middleware verified.
- [ ] Error pages verified.

---

# 15. Deployment Verification

After deployment:

- [ ] Application loads successfully.
- [ ] Login works.
- [ ] Dashboard loads.
- [ ] CRUD operations verified.
- [ ] Email delivery verified (if applicable).
- [ ] File upload verified.
- [ ] Error monitoring operational.
- [ ] No production errors observed.

---

# 16. Release Artifacts

Prepare:

- [ ] Version number updated.
- [ ] Git tag created.
- [ ] Release notes published.
- [ ] Changelog committed.
- [ ] Release archived.

---

# Severity Policy

The following issues block a release:

## Critical

Examples:

- Authentication failure
- Data corruption
- Permission bypass
- Broken routing
- Database inconsistency
- Production build failure

Release Status:

❌ BLOCKED

---

## High

Examples:

- Missing page
- Failed CRUD
- Broken workflow
- Broken DataTable
- Theme unusable

Release Status:

❌ BLOCKED

---

## Medium

Examples:

- Layout inconsistency
- Minor responsive issue
- Visual bug

Release Status:

⚠ Review Required

---

## Low

Examples:

- Icon alignment
- Minor spacing issue
- Typography issue

Release Status:

✅ May Release

---

## Info

Recommendations only.

Does not block release.

---

# Release Decision

A release may proceed only if:

- No Critical issues remain.
- No High issues remain.
- Medium issues are reviewed and accepted.
- Low issues are documented.
- All required validations pass.

---

# Definition of Ready for Production

A release is considered production-ready when:

- All mandatory checklist items are completed.
- Automated tests pass.
- Documentation is complete.
- Deployment configuration is verified.
- Rollback strategy is available.
- Production deployment has been approved.

---

# AI Agent Rules

Before recommending a production release, AI agents MUST:

- Read AGENTS.md.
- Follow CODING_STANDARD.md.
- Follow COMMIT_POLICY.md.
- Respect BUSINESS_RULES.md.
- Verify all release checklist items.
- Never recommend deployment if Critical or High issues remain.
- Never introduce new features during the release phase.
- Recommend only release-blocking fixes.