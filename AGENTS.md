# AGENTS.md

## Stack
- Next.js (App Router)
- TypeScript (strict mode)
- Supabase (Auth, DB, Storage)
- Node.js

---

## Core Rules

- ALWAYS read Next.js docs from:
  node_modules/next/dist/docs/
- NEVER rely on outdated knowledge or guess APIs
- PREFER server components unless interactivity is required
- USE server actions or API routes for mutations
- DO NOT access Supabase directly from client unless required

---

## Architecture

- Follow layered structure:
    - UI (components)
    - Services (business logic)
    - Data layer (Supabase calls)

- DO:
    - isolate Supabase logic in `services/` or `lib/`
    - keep components thin
    - reuse service functions

- DO NOT:
    - put DB logic inside React components
    - mix UI logic with business logic

---

## Supabase Usage

- Use a centralized client:
    - `lib/supabaseClient.ts`
    - `lib/supabaseServer.ts`

- Always:
    - validate inputs before DB calls
    - handle null / empty responses
    - use typed responses

- Avoid:
    - direct queries inside UI
    - duplicating query logic

---

## Data & Error Handling

- ALWAYS handle null/undefined
- NEVER assume API success
- RETURN safe defaults when possible

Example:
- return `null` or `[]` instead of throwing in UI layer
- throw only inside service layer

---

## Feature Flags (if used)

- Wrap optional logic behind flags
- DO NOT hardcode feature switches
- Prefer config-driven behavior

---

## File Conventions

- Components: `PascalCase.tsx`
- Services: `camelCase.ts`
- Hooks: `useSomething.ts`
- Constants: `UPPER_SNAKE_CASE`

---

## Commands

- Dev:
  npm run dev

- Build:
  npm run build

- Lint:
  npm run lint

- Test:
  npm test

---

## Constraints

- DO NOT modify:
    - generated files
    - environment configs
    - migration history

- DO NOT:
    - introduce new libraries without need
    - change project structure unnecessarily

---

## Security

- NEVER expose:
    - service role keys
    - private env variables

- Always:
    - use server-side Supabase client for sensitive operations

---

## Output Expectations

- Write clean, minimal, production-ready code
- Prefer readability to cleverness
- Follow existing patterns in the repo
- Avoid over-engineering

## Language Policy

- All code must be in English: variable names, function names,                                                                                   
  comments, activity log messages, type names, constants, enums
- UI strings are in Bahasa Indonesia (default locale)
- Build i18n with next-intl from the start — no hardcoded UI strings
- Domain terms follow the mapping in docs/GLOSSARY.md — always check it                                                                               
  before naming anything domain-related  