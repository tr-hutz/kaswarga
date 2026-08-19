/*
 * 035_import_management_permission
 *
 * Adds import.view permission for the Manajemen Impor page.
 *
 * import.view — who can access the Import Management page:
 *   RT_ADMIN  — ✅ (initiates imports)
 *   TREASURER — ✅ (confirms staged imports)
 *   RT_CHAIR  — ✅ (approves PENDING_APPROVAL batches)
 *   SECRETARY — ❌
 *   RESIDENT  — ❌
 *
 * Dependencies: 012_rbac_seed (roles and permissions tables)
 */


/* --------------------------------------------------------------------------
 * Permission record
 * -------------------------------------------------------------------------- */

INSERT INTO permissions (code, name, description, is_system) VALUES
    ('import.view', 'View Import Management', 'Access the Import Management page', true)
ON CONFLICT (code) DO NOTHING;


/* --------------------------------------------------------------------------
 * RT_ADMIN
 * -------------------------------------------------------------------------- */

INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles r
CROSS  JOIN permissions p
WHERE  r.code = 'RT_ADMIN'
  AND  p.code = 'import.view'
ON CONFLICT (role_id, permission_id) DO NOTHING;


/* --------------------------------------------------------------------------
 * TREASURER
 * -------------------------------------------------------------------------- */

INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles r
CROSS  JOIN permissions p
WHERE  r.code = 'TREASURER'
  AND  p.code = 'import.view'
ON CONFLICT (role_id, permission_id) DO NOTHING;


/* --------------------------------------------------------------------------
 * RT_CHAIR
 * -------------------------------------------------------------------------- */

INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles r
CROSS  JOIN permissions p
WHERE  r.code = 'RT_CHAIR'
  AND  p.code = 'import.view'
ON CONFLICT (role_id, permission_id) DO NOTHING;
