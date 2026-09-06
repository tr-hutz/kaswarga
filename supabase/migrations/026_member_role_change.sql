/*
 * 030_member_role_change
 *
 * Adds the ability for RT_ADMIN to change the role of any member within their RT.
 *
 * Changes:
 *   1. New permission  — membership.role_update (seeded in 012; re-inserted here
 *      with ON CONFLICT DO NOTHING as a safety net for existing DBs)
 *   2. Grant           — membership.role_update → RT_ADMIN only (same safety-net pattern)
 *   3. DB-level guard  — guard_min_rt_admin trigger on memberships
 *      Prevents demoting the last active ADMIN in an RT.
 *
 * The API layer also performs an eager check and returns HTTP 422 before the
 * trigger fires, giving users a clear error message.
 *
 * Dependencies: 012_rbac_seed, 011_rbac_tables
 */


/* --------------------------------------------------------------------------
 * 1. New permission
 * -------------------------------------------------------------------------- */

INSERT INTO permissions (code, name, description, is_system) VALUES
    ('membership.role_update', 'Change Member Role', 'Reassign the role of a member within the RT', true)
ON CONFLICT (code) DO NOTHING;


/* --------------------------------------------------------------------------
 * 2. Grant to RT_ADMIN only
 * -------------------------------------------------------------------------- */

INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles r
CROSS  JOIN permissions p
WHERE  r.code = 'RT_ADMIN'
  AND  p.code = 'membership.role_update'
ON CONFLICT (role_id, permission_id) DO NOTHING;


/* --------------------------------------------------------------------------
 * 3. Guard: an RT must always retain at least one active ADMIN
 *
 * Fires BEFORE UPDATE on memberships whenever a row's role changes
 * away from 'ADMIN'.  If no other active ADMIN exists in the same RT
 * the statement is aborted with SQLSTATE P0001 and error code
 * 'LAST_ADMIN_DEMOTION' so the API layer can surface a clear message.
 * -------------------------------------------------------------------------- */

CREATE OR REPLACE FUNCTION guard_min_rt_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_remaining INT;
BEGIN
    -- Only relevant when demoting an ADMIN to a different role
    IF OLD.role = 'ADMIN' AND NEW.role <> 'ADMIN' THEN
        SELECT COUNT(*) INTO v_remaining
        FROM   memberships
        WHERE  rt_id  = NEW.rt_id
          AND  role   = 'ADMIN'
          AND  status = 'active'
          AND  id    <> NEW.id;

        IF v_remaining = 0 THEN
            RAISE EXCEPTION 'LAST_ADMIN_DEMOTION'
                USING DETAIL = 'RT harus memiliki minimal satu Administrator';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_min_rt_admin ON memberships;

CREATE TRIGGER trg_guard_min_rt_admin
    BEFORE UPDATE ON memberships
    FOR EACH ROW
    EXECUTE FUNCTION guard_min_rt_admin();
