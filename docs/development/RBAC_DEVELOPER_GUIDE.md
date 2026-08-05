# RBAC Developer Guide

This guide covers the complete lifecycle of adding, modifying, and testing RBAC permissions in KasWarga.

Read this before:
- Adding a new feature that requires access control
- Adding a new API route that reads or writes sensitive data
- Adding a new sidebar navigation item
- Adding a new database table

---

## Quick Reference

| Task | Files to touch |
|------|---------------|
| New permission | `types.ts` → migration → seed → catalog |
| Assign to role | migration (role_permissions INSERT) → `DEFAULT_ROLE_MATRIX.md` |
| Sidebar item | `navigation-config.ts` |
| Route guard | `app/[route]/page.tsx` |
| Component guard | `<Can permission={...}>` or `usePermission()` |
| API guard | `requirePermission(ctx.authorization, PERMISSION.X)` |
| RLS policy | new migration with `has_permission(rt_id, 'x.y')` |

---

## Step 1 — Declare the Permission Constant

**File:** `lib/auth/types.ts`

Add the constant to the `PERMISSION` object in the relevant module group:

```typescript
// Settings
SETTINGS_VIEW:   'settings.view',
SETTINGS_UPDATE: 'settings.update',
MY_FEATURE_VIEW: 'my_feature.view',  // ← add here
```

Rules:
- Code format: `module.action` (two lowercase parts, dot-separated)
- Constant name: `UPPER_SNAKE_CASE`
- Module and action must be English
- Action is one of: `view`, `create`, `update`, `delete`, `approve`, `reject`, `export`, `import`
- Do not add the constant before the feature exists — phantom constants cause confusion

For planned features not yet built:
```typescript
ANNOUNCEMENT_VIEW: 'announcement.view',  // planned
```

---

## Step 2 — Add a Database Migration

Create a new migration file: `supabase/migrations/NNN_rbac_<feature>_permission.sql`

Numbering: use the next sequential number after existing migrations.

```sql
/*
 * NNN_rbac_my_feature_permission
 *
 * Adds my_feature.view permission and assigns it to RT_ADMIN.
 *
 * Dependencies: 012_rbac_seed
 */

INSERT INTO permissions (code, name, description, is_system)
VALUES (
    'my_feature.view',
    'View My Feature',
    'Access the My Feature module',
    true
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'RT_ADMIN'
  AND p.code = 'my_feature.view'
ON CONFLICT (role_id, permission_id) DO NOTHING;
```

Notes:
- Always use `ON CONFLICT DO NOTHING` — migrations must be idempotent
- Add role assignments in the same migration as the permission INSERT
- Never modify `012_rbac_seed.sql` — that file records the original RBAC v2 baseline

---

## Step 3 — Update the Permission Catalog

**File:** `docs/database/PERMISSION_CATALOG.md`

Add an entry in the correct module section:

```markdown
| `my_feature.view` | View My Feature | Access the My Feature module | RT_ADMIN |
```

The catalog is the documentation source of truth for all active permissions.

---

## Step 4 — Update the Role Matrix

**File:** `docs/planning/DEFAULT_ROLE_MATRIX.md`

Add the new permission to the matrix, marking which roles receive it by default.

---

## Step 5 — Add Sidebar Navigation (if needed)

**File:** `lib/navigation/navigation-config.ts`

```typescript
{
    label:      'myFeature',
    href:       '/my-feature',
    icon:       'icon-name',
    permission: PERMISSION.MY_FEATURE_VIEW,
    requiresRt: true,  // true = hidden from SUPER_ADMIN
    // noRt: true,     // true = hidden from RT members (SUPER_ADMIN only)
}
```

Add the label to `messages/id.json` under the `navigation` key:
```json
"myFeature": "Fitur Saya"
```

Navigation items are automatically hidden when the user lacks the permission. SUPER_ADMIN bypasses permission checks and sees all items without `requiresRt: true`.

---

## Step 6 — Add Route Protection

**File:** `app/my-feature/page.tsx`

```typescript
import { Suspense }          from 'react'
import { getRequestContext } from '@/lib/auth/server'
import { PERMISSION }        from '@/lib/auth/types'
import { UnauthorizedError } from '@/lib/auth/errors'
import ForbiddenState        from '@/components/ui/ForbiddenState'
import MyFeatureContainer    from '../../features/my-feature/MyFeatureContainer'

export default async function Page() {
    try {
        const ctx  = await getRequestContext()
        const auth = ctx.authorization

        if (!auth.hasPermission(PERMISSION.MY_FEATURE_VIEW)) {
            return <ForbiddenState />
        }

        return (
            <Suspense>
                <MyFeatureContainer />
            </Suspense>
        )
    } catch (err) {
        if (err instanceof UnauthorizedError) {
            return <ForbiddenState />
        }
        throw err
    }
}
```

This is the server-side guard. Always add this — do not rely solely on navigation hiding or client-side checks.

---

## Step 7 — Add Component-Level Guards

Use `<Can>` for conditional rendering:

```typescript
import { Can }       from '@/components/ui/Can'
import { PERMISSION } from '@/lib/auth/types'

// Inside JSX:
<Can permission={PERMISSION.MY_FEATURE_CREATE}>
    <button onClick={openForm}>Tambah</button>
</Can>
```

Use `usePermission()` when you need the boolean value (e.g., for conditional logic):

```typescript
import { usePermission } from '@/lib/auth/usePermission'
import { PERMISSION }    from '@/lib/auth/types'

const canCreate = usePermission(PERMISSION.MY_FEATURE_CREATE)

// In JSX:
{canCreate && <div>...</div>}
```

Both `<Can>` and `usePermission()` use the client-side `useAuth()` context. They work only in client components (`'use client'`).

---

## Step 8 — Protect API Routes

**File:** `app/api/my-feature/route.ts`

```typescript
import { getRequestContext } from '@/lib/auth/server'
import { requirePermission } from '@/lib/auth/helpers'
import { PERMISSION }        from '@/lib/auth/types'

export async function POST(request: Request) {
    try {
        const ctx = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.MY_FEATURE_CREATE)

        // ... handler logic
    } catch (err) {
        // error handling
    }
}
```

`requirePermission()` throws `ForbiddenError` if the permission is absent. The error boundary in the caller returns a 403 response.

For read-only catalog data (no sensitive data), `requirePermission` may be omitted if RLS provides adequate protection.

---

## Step 9 — Add RLS Policy

Create a new migration (or extend an existing one) to add a database-level policy:

```sql
/*
 * NNN_rbac_my_feature_rls
 */

ALTER TABLE my_feature_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "my_feature: view"
    ON my_feature_table FOR SELECT TO authenticated
    USING (has_permission(rt_id, 'my_feature.view'));

CREATE POLICY "my_feature: create"
    ON my_feature_table FOR INSERT TO authenticated
    WITH CHECK (has_permission(rt_id, 'my_feature.create'));

CREATE POLICY "my_feature: update"
    ON my_feature_table FOR UPDATE TO authenticated
    USING     (has_permission(rt_id, 'my_feature.update'))
    WITH CHECK (has_permission(rt_id, 'my_feature.update'));

CREATE POLICY "my_feature: delete"
    ON my_feature_table FOR DELETE TO authenticated
    USING (has_permission(rt_id, 'my_feature.delete'));
```

`has_permission(rt_id, 'code')` automatically handles:
- SUPER_ADMIN bypass (returns `true` for any permission)
- RT isolation (checks the membership for `auth.uid()` in the given `rt_id`)
- Permission overrides (checks `rt_permission_overrides` after base grants)

Always pass the `rt_id` column of the table being protected.

---

## Step 10 — Update Tests

**File:** `tests/` (Playwright)

If the new feature has any protected behavior, update or add E2E tests:

```typescript
// tests/my-feature.spec.ts
test('admin can create', async ({ page }) => { ... })
test('resident cannot create', async ({ page }) => { ... })
test('unauthorized user sees 403', async ({ page }) => { ... })
```

See `docs/testing/PLAYWRIGHT_AUTHORIZATION.md` for test patterns.

---

## Step 11 — Update Documentation

| Document | Update |
|----------|--------|
| `docs/database/PERMISSION_CATALOG.md` | Add permission entry |
| `docs/planning/DEFAULT_ROLE_MATRIX.md` | Add role assignment |
| `docs/database/DATABASE_SCHEMA.md` | Add table if new table added |
| `docs/business/BUSINESS_RULES.md` | Document new business rule if applicable |
| `docs/business/PERMISSION_MATRIX.md` | Update if access model changed |

---

## Permission Lifecycle Summary

```
1. types.ts       — declare PERMISSION constant
2. migration      — INSERT into permissions table
3. migration      — INSERT into role_permissions table
4. catalog        — document in PERMISSION_CATALOG.md
5. role matrix    — update DEFAULT_ROLE_MATRIX.md
6. navigation     — add to navigation-config.ts (if page)
7. route guard    — getRequestContext + hasPermission in page.tsx
8. component      — <Can> or usePermission in UI
9. API route      — requirePermission in route handler
10. RLS           — has_permission() policy in migration
11. tests         — Playwright coverage
12. docs          — update affected documentation
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `lib/auth/types.ts` | PERMISSION and ROLE_CODE constants |
| `lib/auth/permission-service.ts` | Resolves effective permissions for a user |
| `lib/auth/server.ts` | `getRequestContext()` — server-side auth context |
| `lib/auth/helpers.ts` | `requirePermission()` — throws ForbiddenError |
| `lib/auth/useAuth.ts` | Client-side auth hook |
| `lib/auth/usePermission.ts` | Client-side permission boolean hook |
| `components/ui/Can.tsx` | Client-side conditional render component |
| `lib/navigation/navigation-config.ts` | Sidebar navigation items |
| `supabase/migrations/013_rbac_functions.sql` | `has_permission()` and `is_super_admin()` |
| `docs/database/PERMISSION_CATALOG.md` | Active permission documentation |

---

## Common Mistakes

**Mistake 1: Seeding the permission without assigning it to any role**

A seeded permission with no `role_permissions` entry is effectively inaccessible to all non-SUPER_ADMIN users. Always add at least one role assignment in the same migration.

**Mistake 2: Skipping the route guard**

Client-side guards (`<Can>`, `usePermission`) hide UI but do not prevent direct URL access. Always add a server-side `hasPermission()` check in the page component.

**Mistake 3: Using raw string literals**

```typescript
// ❌ Wrong
requirePermission(ctx.authorization, 'resident.view')

// ✅ Correct
requirePermission(ctx.authorization, PERMISSION.RESIDENT_VIEW)
```

Using raw strings bypasses TypeScript type checking and breaks if the constant is ever updated.

**Mistake 4: Modifying 012_rbac_seed.sql**

The seed file records the original RBAC v2 baseline. New permissions must go in new numbered migration files, not in the seed.

**Mistake 5: Checking `membership.role === 'RT_ADMIN'` instead of a permission**

Role checks are brittle. Use `hasPermission()` / `<Can>` / `usePermission()` — these respect overrides and SUPER_ADMIN bypass automatically.
