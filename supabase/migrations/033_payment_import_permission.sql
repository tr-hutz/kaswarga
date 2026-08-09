/*
 * 033_payment_import_permission
 *
 * Adds the dedicated `payment.import` permission for the shared import
 * framework. Previously the import UI used `payment.update` as a proxy;
 * this migration grants a purpose-specific permission so import access
 * can be controlled independently of general payment editing.
 *
 * Role matrix (matches existing payment.update grants):
 *   RT_ADMIN  — ✅ import
 *   TREASURER — ✅ import
 *   RT_CHAIR  — ❌ (Chair approves imports, does not initiate them)
 *
 * Dependencies: 012_rbac_seed (roles and permissions tables)
 */


/* --------------------------------------------------------------------------
 * Permission record
 * -------------------------------------------------------------------------- */

INSERT INTO permissions (code, name, description, is_system) VALUES
    ('payment.import', 'Import Payments', 'Import payment data from Excel or CSV', true)
ON CONFLICT (code) DO NOTHING;


/* --------------------------------------------------------------------------
 * RT_ADMIN — import
 * -------------------------------------------------------------------------- */

INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles r
CROSS  JOIN permissions p
WHERE  r.code = 'RT_ADMIN'
  AND  p.code = 'payment.import'
ON CONFLICT (role_id, permission_id) DO NOTHING;


/* --------------------------------------------------------------------------
 * TREASURER — import
 * -------------------------------------------------------------------------- */

INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles r
CROSS  JOIN permissions p
WHERE  r.code = 'TREASURER'
  AND  p.code = 'payment.import'
ON CONFLICT (role_id, permission_id) DO NOTHING;
