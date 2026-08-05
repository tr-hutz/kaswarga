# RBAC Architectural Decision Records

> Project: KasWarga
>
> Version: 2.0 (RBAC v2)
>
> Audience: Software engineers and system architects maintaining or extending the KasWarga RBAC system.
>
> This document records the *why* behind major design choices.
> For *how* to implement a new permission, see `docs/development/RBAC_DEVELOPER_GUIDE.md`.

---

## ADR-001 — Permission-Based Authorization Instead of Role-Based Checks

### Context

Early versions of KasWarga checked the membership role string directly at enforcement points:

```typescript
if (membership.role === 'TREASURER') { ... }
```

This approach tied enforcement logic to role names. When a role's responsibilities changed, every enforcement point needed to be found and updated. It was also impossible to grant one RT a capability without changing the role definition globally.

### Decision

Authorization decisions are made by checking a **permission code**, never a role name.

```typescript
// Forbidden
if (membership.role === 'TREASURER') { ... }

// Required
if (auth.hasPermission(PERMISSION.PAYMENT_APPROVE)) { ... }
```

Roles are a grouping mechanism that determines which permissions a user receives by default. They are never the direct subject of an authorization check.

### Consequences

- A role's permission set can change without touching enforcement code.
- RT-level overrides (ADR-003) are transparent to all enforcement points.
- Adding a new capability requires a new permission constant, not a new role.
- Role names become internal implementation details of the RBAC tables, not application-layer identifiers.

---

## ADR-002 — Role Inheritance Through Permissions

### Context

KasWarga roles are hierarchical in practice: RT_ADMIN can do everything RT_CHAIR can do, plus more. A naive approach would copy permission lists between roles, creating duplication and drift.

### Decision

There is no explicit role inheritance chain in the database. Each role has its own `role_permissions` rows.

The apparent hierarchy — RT_ADMIN seeing more than TREASURER — emerges entirely from which permissions were granted to each role in the seed migrations. Inheritance is a documentation concept (`docs/planning/DEFAULT_ROLE_MATRIX.md`), not a database constraint.

### Consequences

- The schema remains simple: `role_permissions` is a flat join table.
- Role permission sets are independently auditable.
- Granting a permission to RT_ADMIN does not automatically grant it to RT_CHAIR; the matrix must be intentional.
- The `RBAC_DEVELOPER_GUIDE.md` lifecycle (Step 2) requires the developer to explicitly assign each new permission to every role that should receive it.

---

## ADR-003 — Permission Override Mechanism

### Context

RT committees in Indonesia operate under different local bylaws. One RT may allow the TREASURER to approve expense claims; another may not. Serving this variation by creating per-RT custom roles would cause role proliferation and make the permission matrix unmaintainable.

### Decision

A dedicated `rt_permission_overrides` table stores per-`(rt_id, role_id, permission_id)` boolean flags that may **grant** or **revoke** a permission on top of the role default.

Resolution order inside `PermissionService.merge()`:

```
Base role permissions
        +
RT overrides (allow=true  → add)
           (allow=false → remove)
        =
Effective permission set (frozen ReadonlySet)
```

The RLS function `has_permission(rt_id, code)` applies the same logic at the database layer, making overrides transparent to all enforcement points.

### Consequences

- No new role is created when an RT needs a capability variation.
- The effective permission of a user can differ from the default matrix without any code change.
- Overrides are auditable: the `rt_permission_overrides` table is append-friendly and all mutations require `permission.override` permission.
- The `settings/authorization` UI surface (RT_ADMIN only) exposes overrides; SUPER_ADMIN manages via direct database administration.

---

## ADR-004 — Super Admin Separated From RT RBAC

### Context

The platform requires a global administrator account to approve RT registrations, manage users across all RTs, and perform operations that are not scoped to any single RT. Fitting SUPER_ADMIN into the RT permission model would require either an all-encompassing role entry or `rt_id = NULL` rows in every permission table, which would complicate every RLS policy and permission resolution query.

### Decision

SUPER_ADMIN is **outside** the RT permission ecosystem entirely.

- There are no `role_permissions` rows for SUPER_ADMIN.
- When `PermissionService` detects a SUPER_ADMIN membership it returns a `SuperAdminPermissionSet` that unconditionally returns `true` for every `hasPermission()` call, without querying the permission tables.
- In the database, `is_super_admin()` is a SECURITY DEFINER function that checks `memberships.role = 'SUPER_ADMIN'` directly, bypassing RLS. `has_permission()` calls `is_super_admin()` as its first guard.
- RT-scoped navigation items use `requiresRt: true` in `navigation-config.ts` and are hidden from SUPER_ADMIN. RT-only pages render an inline 403 view when accessed by SUPER_ADMIN rather than redirecting, so the URL is preserved.

### Consequences

- The permission matrix is simpler: SUPER_ADMIN rows are always `—` (not applicable), not a superset of RT roles.
- Performance: SUPER_ADMIN skips all 4 DB calls in `buildContext()` — the context is built from a single membership check.
- SUPER_ADMIN cannot act as an RT member; it can only perform platform-administration actions.
- RT isolation (ADR-009) still applies to SUPER_ADMIN at the application layer for RT-scoped pages.

---

## ADR-005 — PermissionService as the Single Authorization Engine

### Context

Without a centralized resolver, permission logic would be duplicated across API routes, server actions, page components, and RLS policies. Duplication leads to inconsistency: one enforcement point may apply overrides while another does not.

### Decision

`lib/auth/permission-service.ts` is the **only** component permitted to resolve permissions from the database. All other code receives an `AuthorizationContext` or `PermissionSet` that was produced by this service.

Enforcement points never query `role_permissions` or `rt_permission_overrides` directly. They call one of:

- `auth.hasPermission(PERMISSION.X)` — page route guards and server actions
- `requirePermission(ctx.authorization, PERMISSION.X)` — API route handlers (throws `ForbiddenError`)
- `<Can permission={PERMISSION.X}>` — client components (reads from `useAuth()`)
- `usePermission(PERMISSION.X)` — client hook for conditional logic

### Consequences

- Override logic lives in exactly one place (`PermissionService.merge()`).
- Changes to resolution order (e.g., future group-level overrides) require one file change, not a cross-codebase search.
- The service is dependency-injected (Supabase client via constructor), making it unit-testable with a mock client.
- The singleton `permissionService` exported from the file uses `supabaseAdmin` (service role) so it can read RBAC tables regardless of the caller's RLS context.

---

## ADR-006 — Supabase RLS as the Final Authorization Layer

### Context

Application-layer authorization (ADR-005) is the primary enforcement mechanism, but it operates in process memory. If a bug, misconfiguration, or future code path bypasses `PermissionService`, raw data could be exposed at the database level. Trusting the application layer alone violates defense-in-depth.

### Decision

Every table containing business data has Row Level Security enabled. Policies call `has_permission(rt_id, 'module.action')` rather than checking role names. This mirrors the application-layer model exactly.

Authorization is enforced at five layers:

```
1. Authentication   — Supabase Auth session
2. Route guard      — server component hasPermission()
3. Service layer    — requirePermission() in API/action handlers
4. Repository layer — application queries scoped by user context
5. PostgreSQL RLS   — final boundary, enforced unconditionally
```

RLS must never be the only guard (performance), but it must always be present (correctness guarantee).

### Consequences

- A compromised application layer cannot leak data to a differently-scoped user — PostgreSQL enforces the same permission model.
- RLS policies fail-closed: unauthenticated or unauthorized queries return zero rows or an error, never data.
- The `ledger` table INSERT policy was intentionally dropped (migration `024`) because `insert_ledger()` is SECURITY DEFINER and the only valid INSERT path — an authenticated INSERT policy would be both unnecessary and misleading.
- Storage tenant isolation is deferred (migration `026` placeholder) pending a path naming convention audit.

---

## ADR-007 — No CRUD UI for Permissions

### Context

Permissions are the source of truth for what operations exist in the system. If permissions can be created, renamed, or deleted at runtime through a UI, the set of valid permission codes diverges from the TypeScript constants in `lib/auth/types.ts` and the RLS policy strings. Runtime mutations break type safety and make permission coverage analysis unreliable.

### Decision

Permissions are defined exclusively through database migrations. There is no UI for creating or deleting permission records.

The `permission.update` and `permission.override` permissions grant RT_ADMIN the ability to change **role assignments** (which permissions a role holds) and **per-RT overrides** — but never to create new permission codes or remove existing ones from the catalog.

New permissions follow the lifecycle in `RBAC_DEVELOPER_GUIDE.md`, which requires both a migration and a `types.ts` constant in the same change.

### Consequences

- The TypeScript `PERMISSION` object is always in sync with the database catalog.
- `npm run rbac:audit` (Phase 1/2 script) can statically verify that every constant has a database row and every database row has a constant.
- Permission codes are stable identifiers — they can be safely referenced in RLS policy strings, Playwright tests, and documentation.
- Adding a permission requires a developer workflow, not a runtime operation. This is intentional: permissions represent capabilities the system provides, not data the system manages.

---

## ADR-008 — Dashboard Action Widgets Use RBAC; Information Cards Use Presentation Policy

### Context

The dashboard presents two categories of UI elements with different authorization semantics:

1. **Action widgets** — buttons and forms that trigger state-changing operations (approve payment, reject expense). These represent capabilities.
2. **Information cards** — read-only statistical summaries (total payments, total residents, cashflow chart). These represent data viewpoints.

Applying RBAC permission checks to information cards creates confusion: should RESIDENT see `Total Aktivitas`? The permission system does not express "data visibility for an audience role" well.

### Decision

**Action widgets** are guarded by explicit permission checks via `<Can permission={PERMISSION.X}>`. They appear only when the user holds the corresponding capability.

**Information cards** are guarded by **Presentation Policy** (also called Audience Policy): visibility is determined by the user's role category, not by a named permission. Concretely, a role-based branch in the container (`isSuperAdmin`, or an equivalent audience flag) decides which card set to render.

Example: the Activity analytics section shows RT-scoped breakdown cards (payment approvals, expense rejections) for RT members and hides them for SUPER_ADMIN, because those metrics are meaningless outside an RT context. This is not an authorization decision — it is a presentational one.

### Consequences

- Permission codes remain semantically precise: a permission means "this user may perform this operation", not "this user sees this widget".
- Information cards do not require new permission constants, avoiding catalog bloat.
- The separation is explicit in component props: action guards use `<Can>` while display variants use boolean flags (`showDetails`, `isSuperAdmin`).
- Presentation Policy logic belongs in Container components, never in UI components or PermissionService.

---

## ADR-009 — Tenant Isolation Is Enforced Independently From Permission

### Context

KasWarga is a multi-tenant system: each RT is a tenant with its own data boundary. It is tempting to express isolation as a permission (`rt.access` or similar), but that conflates two different concerns: **who can perform an action** (permissions) and **which data scope the action applies to** (tenant isolation).

### Decision

Tenant isolation is enforced through the `rt_id` foreign key that every business table carries (see `DATABASE_DECISIONS.md` DD-011). RLS policies always filter by `rt_id` independently of permission checks.

The two layers are AND-composed:

```sql
-- A user must BOTH belong to the RT AND hold the permission.
USING (
    rt_id = get_user_rt_id()           -- tenant isolation
    AND has_permission(rt_id, 'x.y')   -- permission check
)
```

`has_permission(rt_id, code)` itself validates RT membership before evaluating the permission, so a user from RT A cannot evaluate permissions as if they were in RT B.

### Consequences

- Gaining a permission within RT A does not grant any access to RT B's data.
- A permission override in RT A has no effect on RT B — overrides are scoped by `(rt_id, role_id)`.
- SUPER_ADMIN bypasses permission checks but is still subject to tenant isolation at the application layer (RT-scoped pages render a 403 view).
- Permission redesign (changing who can approve payments) never accidentally affects isolation logic, and vice versa.

---

## ADR-010 — One Task, One Commit Development Strategy

### Context

The RBAC v2 implementation spans migrations, TypeScript types, service logic, UI components, API routes, RLS policies, documentation, and test coverage. Combining all of these into one large commit makes it impossible to understand, bisect, or revert a specific change later.

### Decision

Each logical unit of work produces exactly one atomic commit following the Conventional Commits format (`type(scope): description`). A commit must be:

- **Atomic** — represents a single complete change that keeps the build passing.
- **Reversible** — `git revert <sha>` produces a meaningful undo without side effects on unrelated code.
- **Self-contained** — the commit message and diff together explain what changed and why.

Migrations are never amended after they run in any environment. New changes to the schema always go in a new numbered migration file.

### Consequences

- `git log --oneline` reads as a linear changelog of features and fixes.
- Bisection to find a regression is tractable because each commit is a complete, working state.
- The RBAC sprint history (`feat(rbac)` → `fix(rbac)` → `chore(rbac)`) is auditable independently of other feature work.
- This discipline requires resisting the urge to bundle a documentation update into a code change commit — they remain separate to maintain searchability.

---

## ADR-011 — Permission Cache Design

### Context

`PermissionService.buildContext()` requires up to 4 sequential database round-trips for a non-SUPER_ADMIN user: memberships lookup → role resolution → role permissions → RT overrides. In a server-rendered Next.js application, multiple server components and middleware in a single request may call `buildContext()` for the same user. Without caching, this multiplies DB load linearly with the number of components.

### Decision

`PermissionService` uses `React.cache()` to create **request-scoped Memoization Maps**. `React.cache()` ties the Map lifetime to the current React async storage context, which corresponds to exactly one HTTP request. The Map is created on first access and garbage-collected when the request completes.

```
Request N begins
  → React async context created
  → _getContextStore() returns a fresh Map (request-scoped)
  → First buildContext(userId) → cache MISS → 4 DB calls → stored in Map
  → Second buildContext(userId) → cache HIT → returned from Map, 0 DB calls
Request N ends → React async context destroyed → Map garbage-collected
```

**Cache invalidation:** not needed. The Map is discarded at request end. There is no cross-request cache to invalidate. If a permission override is changed mid-session, the next request resolves the fresh effective permissions from the database automatically.

The public `invalidateCache()` method is a no-op retained for API compatibility and to allow a future cross-request cache (e.g., Redis-backed) to be added without changing callers.

### Consequences

- Within a single HTTP request, `buildContext()` performs at most 4 DB calls regardless of how many components invoke it.
- No cache warming, no cache expiry configuration, no cache invalidation bugs.
- Security: a permission change takes effect at the next request boundary — at most one request delay. This is acceptable for an intranet application with low-latency RT committee operations.
- SUPER_ADMIN skips all DB calls entirely (the `SuperAdminPermissionSet` is constructed without any query after the initial membership check).

---

## ADR-012 — Future Extension Guidelines

### Context

RBAC v2 was designed to support additional permission granularity, new modules, new roles, and multi-organization deployment. Extensions must not require changes to the authorization architecture.

### Decision

**Adding a new permission:**
Follow the 11-step lifecycle in `RBAC_DEVELOPER_GUIDE.md`. Key invariants:
1. Every new permission constant in `lib/auth/types.ts` must have a corresponding `INSERT INTO permissions` migration in the same PR.
2. The migration must also assign the permission to at least one role via `role_permissions`.
3. The migration file name must follow `NNN_rbac_<feature>_permission.sql` — never modify the baseline `012_rbac_seed.sql`.
4. Run `npm run rbac:audit` after the migration to verify no dead constants or phantom catalog entries.

**Adding a new module:**
Create a new permission group in `types.ts` (e.g., `ANNOUNCEMENT_VIEW: 'announcement.view'`). Add RLS policies using `has_permission(rt_id, 'announcement.view')`. No schema changes to the RBAC tables are required.

**Adding a new role:**
Insert a row into the `roles` table and add `role_permissions` assignments in a new migration. Add the role code to the `ENUM_TO_ROLE_CODE` map in `permission-service.ts`. Run `npm run rbac:roles` to verify grant counts.

**Adding a new RLS policy:**
Use `has_permission(rt_id, 'code')` — never check role names in SQL. Always add paired positive and negative Playwright tests. Document the policy change in `docs/database/RLS_POLICY.md`.

**Multi-organization expansion:**
The current schema supports it: `memberships.rt_id` can reference different organizations and `rt_permission_overrides` is already scoped per `rt_id`. The main prerequisite is a session context that carries the active organization identifier, which `getRequestContext()` in `lib/auth/server.ts` is designed to accommodate.

---

*End of document.*
