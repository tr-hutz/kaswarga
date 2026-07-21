# KasWarga

Aplikasi manajemen keuangan RT berbasis web — iuran warga, pengeluaran, buku kas, dan laporan dalam satu platform.

---

## Tech Stack

- **Framework** — Next.js 16 (App Router)
- **Language** — TypeScript (strict)
- **Auth & Database** — Supabase (Auth, PostgreSQL, Storage, Realtime)
- **Styling** — Tailwind CSS v4 + semantic design token system
- **i18n** — next-intl (Indonesian)
- **Testing** — Playwright (E2E)

---

## Prerequisites

- Node.js >= 20 (see `.nvmrc`)
- npm >= 10
- A Supabase project

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Apply database migrations
# Run all files in supabase/migrations/ via Supabase SQL editor or CLI

# 4. Seed development data (optional)
npm run seed:auth   # auth users
npm run seed:dev    # business data

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Exposure | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Supabase service role key — never expose to client |
| `NEXT_PUBLIC_SITE_URL` | Client | Fully-qualified public URL — used in invite email links |

See `.env.example` for the full template.

---

## Scripts

```bash
npm run dev           # Start development server
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run ESLint
npm run test:e2e      # Run Playwright E2E tests
npm run seed:auth     # Seed auth users
npm run seed:dev      # Seed development business data
npm run seed:e2e      # Seed E2E test data (resets to pending state)
```

---

## Project Structure

```
app/              Next.js App Router pages and API routes
components/
  layout/         AppShell, Sidebar, Topbar
  common/         Shared business-independent components (DataTable, etc.)
  ui/             Design system primitives (Button, Icon, Badge, etc.)
features/         Business feature modules (payment, expense, resident, etc.)
lib/              Supabase clients, auth, services, repositories
supabase/
  migrations/     Ordered SQL migrations (000–010)
e2e/              Playwright tests and page objects
docs/             Architecture, business rules, database, API documentation
```

---

## Roles

| Role | Description |
|---|---|
| `SUPER_ADMIN` | Platform-level admin — manages RT registrations |
| `CHAIR` | RT Ketua — approves expenses, views reports |
| `ADMIN` | RT Admin — manages residents, payments |
| `TREASURER` | Bendahara — manages expenses, ledger, reports |
| `RESIDENT` | Warga — submits payment confirmations |

---

## Deployment

The application is deployed on **Vercel**.

Required Vercel environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` ← set to your production domain

Production branch: `main`

---

## Documentation

Full project documentation is in `docs/`:

- `docs/architecture/ARCHITECTURE.md`
- `docs/business/BUSINESS_RULES.md`
- `docs/business/PERMISSION_MATRIX.md`
- `docs/database/DATABASE_SCHEMA.md`
- `docs/database/RLS_POLICY.md`
- `docs/api/API_CONVENTION.md`
- `docs/development/CODING_STANDARD.md`
- `docs/development/DESIGN_SYSTEM.md`
