/*
 * =============================================================================
 * 018_RBAC_AUTHORIZATION_FUNCTIONS
 *
 * PostgreSQL helper functions for RBAC v2 permission evaluation.
 *
 * These functions are the single source of truth for runtime authorization.
 * They are called by:
 *   - RLS policies (019_update_rls_policies)
 *   - PermissionService (application layer)
 *
 * All functions are SECURITY DEFINER to bypass the RLS policies on
 * memberships — querying memberships from within its own RLS context
 * would create a circular dependency.
 *
 * Role mapping note:
 *   The user_role enum in memberships predates RBAC v2 and uses different
 *   codes than the roles table (CHAIR → RT_CHAIR, ADMIN → RT_ADMIN).
 *   The CASE mapping below bridges the two until a future migration adds
 *   a role_id FK directly to memberships.
 *
 * Dependencies : 011_rbac_roles, 012_rbac_permissions,
 *                013_rbac_role_permissions, 014_rbac_permission_overrides,
 *                015_seed_roles, 016_seed_permissions
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * has_permission
 *
 * Returns true when the currently authenticated user holds the given
 * permission within the specified RT.
 *
 * Resolution order:
 *   1. SUPER_ADMIN — unconditional platform bypass
 *   2. RT-specific override (rt_permission_overrides.allow)
 *   3. Default role permission (role_permissions.allow)
 *   4. Default deny — absence of a row means denied
 *
 * Usage in RLS:
 *   USING (has_permission(rt_id, 'expense.view'))
 * --------------------------------------------------------------------------- */

CREATE OR REPLACE FUNCTION has_permission(p_rt_id uuid, p_permission_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT
        -- SUPER_ADMIN: platform-level bypass, not bound to any RT
        EXISTS (
            SELECT 1
            FROM   memberships
            WHERE  user_id = auth.uid()
            AND    role    = 'SUPER_ADMIN'
        )
        OR
        -- Effective permission: RT override > role default > deny
        EXISTS (
            SELECT 1
            FROM   memberships                m
            JOIN   roles                      r
                ON r.code = CASE m.role::text
                                WHEN 'CHAIR' THEN 'RT_CHAIR'
                                WHEN 'ADMIN' THEN 'RT_ADMIN'
                                ELSE m.role::text
                            END
            JOIN   permissions                p
                ON p.code = p_permission_code
            LEFT JOIN role_permissions        rp
                ON  rp.role_id       = r.id
                AND rp.permission_id = p.id
            LEFT JOIN rt_permission_overrides ov
                ON  ov.rt_id         = p_rt_id
                AND ov.role_id       = r.id
                AND ov.permission_id = p.id
            WHERE  m.user_id = auth.uid()
            AND    m.rt_id   = p_rt_id
            AND    m.status  = 'active'
            AND    COALESCE(ov.allow, rp.allow, false) = true
        )
$$;

COMMENT ON FUNCTION has_permission(uuid, text) IS
    'RBAC v2 — returns true when auth.uid() holds p_permission_code for p_rt_id. '
    'RT override takes precedence over the role default. Missing row = denied.';


/* ----------------------------------------------------------------------------
 * current_membership
 *
 * Returns all active memberships for the currently authenticated user.
 *
 * Used by PermissionService to build AuthorizationContext at request start.
 * --------------------------------------------------------------------------- */

CREATE OR REPLACE FUNCTION current_membership()
RETURNS SETOF memberships
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT *
    FROM   memberships
    WHERE  user_id = auth.uid()
    AND    status  = 'active'
$$;

COMMENT ON FUNCTION current_membership() IS
    'RBAC v2 — returns all active memberships for the currently authenticated user.';


/* ----------------------------------------------------------------------------
 * current_neighborhood
 *
 * Returns every RT ID that the currently authenticated user actively belongs to.
 *
 * Used by PermissionService and AuthorizationContext to scope data access.
 * SUPER_ADMIN memberships have a NULL rt_id and are excluded from this set.
 * --------------------------------------------------------------------------- */

CREATE OR REPLACE FUNCTION current_neighborhood()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT rt_id
    FROM   memberships
    WHERE  user_id = auth.uid()
    AND    status  = 'active'
    AND    rt_id   IS NOT NULL
$$;

COMMENT ON FUNCTION current_neighborhood() IS
    'RBAC v2 — returns all active RT IDs for the currently authenticated user. '
    'SUPER_ADMIN system memberships (rt_id IS NULL) are excluded.';


/* ----------------------------------------------------------------------------
 * Grants
 * --------------------------------------------------------------------------- */

GRANT EXECUTE ON FUNCTION has_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION current_membership()        TO authenticated;
GRANT EXECUTE ON FUNCTION current_neighborhood()      TO authenticated;
