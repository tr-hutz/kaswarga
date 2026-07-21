# Changelog

All notable changes to KasWarga are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2.0.0] — 2026-07-21

### Highlights

Major release introducing the unified design system, dark mode, and full TailAdmin migration.

### Added

- **Theme system** — light / dark / system preference with per-user persistence via Supabase and localStorage
- **Semantic design tokens** — `bg-surface`, `bg-canvas`, `text-foreground`, `text-muted`, `border-divider`, `shadow-card`, and more; all pages and components updated
- **Dark mode** — full dark mode support across all pages, components, drawers, forms, and charts
- **`global-error.tsx`** — root layout error boundary prevents blank screen on provider failure
- **E2E seed script** — `npm run seed:e2e` resets test data to a known pending state for repeatable Playwright runs

### Changed

- **TailAdmin migration** — all raw TailAdmin-specific utility classes replaced with semantic tokens
- **Sidebar** — dark background with white text; brand area height aligned with topbar (`h-16`)
- **DataTable** — skeleton loading rows with `data-testid="dt-loading"`, `dt-row`, `dt-empty`
- **Activity logger** — resolves current user RT ID from membership instead of falling back to `SYSTEM_RT_ID`, fixing RLS 42501 for non-SUPER_ADMIN users
- **Button component** — `secondary` variant uses semantic tokens (`bg-canvas`)
- **Tooltip component** — `bg-dark` replaced with `bg-sidebar` (always dark in both themes)
- **Error and 404 pages** — retry/back buttons use `bg-primary` instead of raw `bg-dark`
- **Registration forms** — inputs consistently apply `bg-input text-foreground`
- **README** — replaced Next.js boilerplate with KasWarga project documentation

### Fixed

- Activity log RLS violation (code `42501`) when `rtId` was not provided by callers
- Sidebar text appearing as black on dark background (missing `text-white` base on `<aside>`)
- Sidebar brand area misaligned with topbar bottom border
- E2E tests timing out on skeleton rows (switched to `data-testid="dt-row"` selectors)
- Playwright `payment-drawer` not found due to loading state false positives

### Security

- `SUPABASE_SERVICE_ROLE_KEY` confirmed server-only — never exposed to client bundles
- RLS enforced on all business tables; verified against `RLS_POLICY.md`

---

## [1.0.0] — 2026-07-14

### Highlights

Initial production release of KasWarga.

### Added

- RT registration and approval workflow (SUPER_ADMIN)
- Resident registration and membership management
- Monthly iuran (dues) payment confirmation and approval
- Expense management with CHAIR approval workflow
- Ledger (Buku Kas) with PDF/Excel export
- Activity log with real-time feed
- In-app notifications
- Role-based access control (SUPER_ADMIN, CHAIR, ADMIN, TREASURER, RESIDENT)
- Supabase Auth with email invitation flow
- Row Level Security on all business tables
- Playwright E2E test suite
- Indonesian language (next-intl)
