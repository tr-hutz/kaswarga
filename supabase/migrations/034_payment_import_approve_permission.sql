/*
 * 034_payment_import_approve_permission
 *
 * Adds the payment.import_approve permission and grants it to RT_CHAIR.
 * Idempotent via ON CONFLICT guards.
 *
 * Dependencies: 012_rbac_seed, 033_payment_import_permission
 */

INSERT INTO permissions (code, name, description, is_system) VALUES
    ('payment.import_approve', 'Approve Payment Import', 'Approve bulk payment import batches', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles       r
JOIN   permissions p ON p.code = 'payment.import_approve'
WHERE  r.code = 'RT_CHAIR'
ON CONFLICT (role_id, permission_id) DO UPDATE SET allow = true;
