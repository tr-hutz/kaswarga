/*
 * 033_payment_import_permission
 *
 * Adds payment.import, payment.import_approve, and import.view permissions
 * for the shared import framework. (034 and 035 content merged here — all
 * statements are idempotent.)
 *
 * payment.import — who can initiate a payment import:
 *   RT_ADMIN  — ✅
 *   TREASURER — ✅
 *   RT_CHAIR  — ❌ (Chair approves imports, does not initiate them)
 *
 * payment.import_approve — who can approve a PENDING_APPROVAL import batch:
 *   RT_CHAIR  — ✅ (mirrors income/expense: Chair is sole batch approver)
 *
 * import.view — who can access the Import Management page:
 *   RT_ADMIN  — ✅ (manages all imports)
 *   TREASURER — ❌
 *   RT_CHAIR  — ❌
 *
 * Dependencies: 012_rbac_seed (roles and permissions tables)
 */


/* --------------------------------------------------------------------------
 * Permission records
 * -------------------------------------------------------------------------- */

INSERT INTO permissions (code, name, description, is_system) VALUES
    ('payment.import',         'Import Payments',        'Import payment data from Excel or CSV',   true),
    ('payment.import_approve', 'Approve Payment Import', 'Approve bulk payment import batches',     true),
    ('import.view',            'View Import Management', 'Access the Import Management page',       true)
ON CONFLICT (code) DO NOTHING;


/* --------------------------------------------------------------------------
 * RT_ADMIN — payment.import
 * -------------------------------------------------------------------------- */

INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles r
CROSS  JOIN permissions p
WHERE  r.code = 'RT_ADMIN'
  AND  p.code = 'payment.import'
ON CONFLICT (role_id, permission_id) DO NOTHING;


/* --------------------------------------------------------------------------
 * TREASURER — payment.import
 * -------------------------------------------------------------------------- */

INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles r
CROSS  JOIN permissions p
WHERE  r.code = 'TREASURER'
  AND  p.code = 'payment.import'
ON CONFLICT (role_id, permission_id) DO NOTHING;


/* --------------------------------------------------------------------------
 * RT_CHAIR — payment.import_approve
 * -------------------------------------------------------------------------- */

INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles       r
JOIN   permissions p ON p.code = 'payment.import_approve'
WHERE  r.code = 'RT_CHAIR'
ON CONFLICT (role_id, permission_id) DO UPDATE SET allow = true;


/* --------------------------------------------------------------------------
 * RT_ADMIN — import.view
 * -------------------------------------------------------------------------- */

INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles r
CROSS  JOIN permissions p
WHERE  r.code = 'RT_ADMIN'
  AND  p.code = 'import.view'
ON CONFLICT (role_id, permission_id) DO NOTHING;
