/*
 * 033_payment_import_permission
 *
 * Adds payment.import and payment.import_approve permissions for the shared
 * import framework. (034 content merged here — both are idempotent.)
 *
 * payment.import — who can initiate a payment import:
 *   RT_ADMIN  — ✅
 *   TREASURER — ✅
 *   RT_CHAIR  — ❌ (Chair approves imports, does not initiate them)
 *
 * payment.import_approve — who can approve a PENDING_APPROVAL import batch:
 *   RT_CHAIR  — ✅ (mirrors income/expense: Chair is sole batch approver)
 *
 * Dependencies: 012_rbac_seed (roles and permissions tables)
 */


/* --------------------------------------------------------------------------
 * Permission records
 * -------------------------------------------------------------------------- */

INSERT INTO permissions (code, name, description, is_system) VALUES
    ('payment.import',         'Import Payments',        'Import payment data from Excel or CSV',   true),
    ('payment.import_approve', 'Approve Payment Import', 'Approve bulk payment import batches',     true)
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


/* --------------------------------------------------------------------------
 * RT_CHAIR — import_approve
 * -------------------------------------------------------------------------- */

INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles       r
JOIN   permissions p ON p.code = 'payment.import_approve'
WHERE  r.code = 'RT_CHAIR'
ON CONFLICT (role_id, permission_id) DO UPDATE SET allow = true;
