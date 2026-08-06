/*
 * =============================================================================
 * 030_GRANT_AUDIT_VIEW_TO_CHAIR_TREASURER
 *
 * Migration 022 restricted activity_logs reads to RT_ADMIN only via RLS:
 *   has_permission(rt_id, 'audit.view')
 *
 * RT_CHAIR (head of RT) and TREASURER (financial oversight) should also be
 * able to view activity logs for their RT. The Activity module is visible
 * to these roles but returned no data because audit.view was not granted.
 *
 * This migration grants audit.view to RT_CHAIR and TREASURER.
 * =============================================================================
 */

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('RT_CHAIR', 'TREASURER')
  AND p.code = 'audit.view'
ON CONFLICT (role_id, permission_id) DO NOTHING;
