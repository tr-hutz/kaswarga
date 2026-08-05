# RBAC Operations Guide

This guide is for operators and support staff managing KasWarga deployments. It covers permission troubleshooting, cache issues, deployment checklists, and rollback procedures.

---

## Table of Contents

1. [Diagnosing Permission Problems](#1-diagnosing-permission-problems)
2. [Role and Override Management](#2-role-and-override-management)
3. [Permission Cache Troubleshooting](#3-permission-cache-troubleshooting)
4. [Permission Inspector Usage](#4-permission-inspector-usage)
5. [Deployment Checklist](#5-deployment-checklist)
6. [Migration Checklist](#6-migration-checklist)
7. [Rollback Procedures](#7-rollback-procedures)
8. [Known Limitations](#8-known-limitations)

---

## 1. Diagnosing Permission Problems

### Symptom: User sees 403 / "Akses Ditolak" page

**Step 1 — Confirm the user's role.**

In Supabase dashboard → Table Editor → `memberships`:
```sql
SELECT m.id, u.email, m.role, m.status, m.rt_id
FROM memberships m
JOIN users u ON u.id = m.user_id
WHERE u.email = 'user@example.com';
```

**Step 2 — Check if the role has the required permission.**

```sql
SELECT p.code, rp.allow
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.code = 'TREASURER'
ORDER BY p.code;
```

**Step 3 — Check for per-RT overrides.**

```sql
SELECT p.code, o.allow
FROM rt_permission_overrides o
JOIN roles r ON r.id = o.role_id
JOIN permissions p ON p.id = o.permission_id
WHERE o.rt_id = '<rt-uuid>'
  AND r.code = 'TREASURER';
```

If an override row exists with `allow = false`, it revokes the default grant.

**Step 4 — Use the Permission Inspector.**

Navigate to `/settings/authorization/inspector` (requires `rbac.inspector.view`, RT_ADMIN only). Enter the user's email or membership ID to see their effective permission set with override annotations.

---

### Symptom: User can access something they shouldn't

**Step 1 — Verify the page has a server-side guard.**

Check `app/[route]/page.tsx` for `getRequestContext()` and `hasPermission()`. If the page lacks these, the permission gate is client-side only (UI hiding, not enforcement).

**Step 2 — Check RLS.**

The database layer enforces permissions independently. Even if a route is unguarded, RLS on the underlying tables prevents data leakage. Confirm the relevant table has RLS enabled:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'expenses';
```

**Step 3 — Check for overrides that grant unexpected access.**

Run the override query in Step 3 above. A `allow = true` override on a permission the role does not hold by default could explain unexpected access.

---

### Symptom: RT_ADMIN cannot access a feature

This usually means:
1. The feature's permission code is not seeded (`rt.delete` is a known case)
2. The feature's permission is not assigned to `RT_ADMIN` in `role_permissions`
3. An override row with `allow = false` is blocking the default grant

Check with:
```sql
SELECT p.code, rp.allow
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.code = 'RT_ADMIN'
  AND p.code = 'the.permission';
```

If no row returns, the permission was never assigned. Apply a new migration or use the Permission Matrix UI.

---

## 2. Role and Override Management

### Adding a Permission to a Role (Production)

Use the Permission Matrix UI at `/settings/authorization/permissions` (requires `permission.update`, RT_ADMIN only).

For global default changes (affects all RTs), apply a database migration. See the [Migration Checklist](#6-migration-checklist).

### Adding a Per-RT Override

Use the Member Overrides UI at `/settings/authorization/overrides` (requires `permission.override`, RT_ADMIN only).

Overrides apply only to the RT that created them. They stack on top of the default role grants.

### Revoking a Default Permission for a Specific RT

In the Member Overrides UI, create an override row with `allow = false`. This blocks the default grant for that role within that RT without affecting other RTs.

---

## 3. Permission Cache Troubleshooting

The permission system uses two cache layers:

### Layer 1: React Server Components Cache

`getRequestContext()` calls `React.cache()` internally. The cache is per-request — it resets on every new HTTP request. No manual invalidation needed.

### Layer 2: Browser Session (useAuth)

The client-side `useAuth()` hook reads permissions from the Supabase session. After a role or override change:

1. The change is written to the database immediately.
2. The current session does not automatically refresh its permission set.
3. The user must reload the page or log out and back in to see the new permissions.

**If a user reports "I was granted access but still can't do X":**

1. Ask them to hard-reload the page (Ctrl+F5 / Cmd+Shift+R).
2. If still affected, ask them to log out and log back in.
3. If still affected, check the database — the grant may not have been applied correctly.

### Layer 3: RLS Cache (Supabase)

Supabase caches `SECURITY DEFINER` function results at the statement level within a single database connection. This cache is internal and managed by PostgreSQL. In practice, permission changes take effect immediately for new requests.

---

## 4. Permission Inspector Usage

The Permission Inspector at `/settings/authorization/inspector` is available to RT_ADMIN only (requires `rbac.inspector.view`).

**What it shows:**
- Effective permission set for a selected member
- Which permissions come from the role default
- Which permissions are modified by overrides (grant or revoke)
- Whether the member is SUPER_ADMIN (bypasses all checks)

**How to use it for troubleshooting:**

1. Navigate to `/settings/authorization/inspector`
2. Search for the user by email or name
3. Review the permission list for the specific permission in question
4. If the permission is absent — check `role_permissions` for the role
5. If the permission is present but still denied — check the API route's `requirePermission` call

**Inspector limitations:**
- Shows permissions for the current RT only
- Does not show which specific pages or API routes each permission controls
- Does not show RLS policy details

---

## 5. Deployment Checklist

Before deploying a release that includes RBAC changes:

- [ ] All new migrations are in the correct numeric order
- [ ] All migrations use `ON CONFLICT DO NOTHING` (idempotent)
- [ ] New PERMISSION constants in `types.ts` match the codes in the migration INSERT
- [ ] New permissions are assigned to at least one role (or documented as SUPER_ADMIN-only)
- [ ] `PERMISSION_CATALOG.md` updated with new entries
- [ ] `DEFAULT_ROLE_MATRIX.md` updated if default grants changed
- [ ] Route guards added for any new page with sensitive data
- [ ] API routes have `requirePermission` for any mutation endpoint
- [ ] RLS policies added for any new table with RT-scoped data
- [ ] Playwright tests pass for affected flows

---

## 6. Migration Checklist

When writing an RBAC-related migration:

- [ ] File is named `NNN_rbac_<description>.sql` (sequential, lowercase)
- [ ] File header comment describes what changes and why
- [ ] `ON CONFLICT DO NOTHING` used on all INSERT statements
- [ ] `DROP POLICY IF EXISTS` used before `CREATE POLICY`
- [ ] `ALTER POLICY` used when updating existing policy (not drop/recreate)
- [ ] Dependencies listed in file header
- [ ] The migration does not modify `012_rbac_seed.sql`
- [ ] The migration does not break `015_rbac_validation.sql` assertions (or a new validation is added)

Apply migrations in Supabase via:
```
supabase db push
```
or via the Supabase dashboard SQL editor for hotfixes.

---

## 7. Rollback Procedures

### Rolling Back a Permission Grant

If a permission was incorrectly granted to a role:

**Option A — Per-RT override (safe, reversible):**

In the Member Overrides UI, create an override with `allow = false` for the affected RT. This revokes the grant without touching the migration history.

**Option B — Global revoke (requires migration):**

Write a new migration:
```sql
DELETE FROM role_permissions
USING roles r, permissions p
WHERE role_permissions.role_id = r.id
  AND role_permissions.permission_id = p.id
  AND r.code = 'ROLE_CODE'
  AND p.code = 'permission.code';
```

Never delete rows directly in production without a migration file — untracked changes break the migration history.

### Rolling Back a New Permission

If a new permission and its migration need to be removed:

1. Write a compensating migration that DELETEs the `role_permissions` rows and then the `permissions` row.
2. Remove or comment out the PERMISSION constant in `types.ts`.
3. Remove the usage from navigation, route guards, components, and API routes.
4. Deploy the compensating migration before the code change — or deploy atomically.

> **Warning:** Permission code strings are embedded in database rows. Removing a permission from `types.ts` without a compensating DB migration leaves orphaned rows in `permissions` and `role_permissions`.

### Rolling Back RLS Policy Changes

To revert an RLS policy change:
```sql
-- Restore the previous policy
DROP POLICY IF EXISTS "table: action" ON table_name;
CREATE POLICY "table: action"
    ON table_name FOR SELECT TO authenticated
    USING (<previous expression>);
```

Always write this as a new migration, never as a direct SQL hotfix.

---

## 8. Known Limitations

### rt.delete Is Not Seeded

The `RT_DELETE` constant (`rt.delete`) is declared in `types.ts` and used in `/api/rt/[id]`. The permission code has no row in the `permissions` table. The API is therefore inaccessible to all non-SUPER_ADMIN users — which is the intended behavior. If this permission is ever assigned to another role, a migration seeding the `permissions` row must be applied first.

### SUPER_ADMIN Shows Unseeded Permissions in Inspector

The SUPER_ADMIN effective permission set is computed from the `PERMISSION` object in `types.ts`, not from the database. It includes the 9 unseeded constants (`announcement.*`, `event.*`, `rt.delete`). This is cosmetic — these permissions have no DB rows and no functional coverage.

### Permission Changes Require Page Reload

After modifying role grants or overrides via the UI, users with active sessions must reload their browser to see updated permissions in client-side guards (`<Can>`, `usePermission`). Server-side guards recompute on each request and reflect changes immediately.

### RLS on `users` Table Is Not Enabled

The `users` table has no RLS. It is accessed exclusively via `supabaseAdmin` (service_role) in the application, which bypasses RLS. Direct queries from authenticated clients to this table would succeed. This is a known design choice — the table is not exposed to the Supabase client directly in any current code path.
