/*
 * =============================================================================
 * 034_PAYMENT_IMPORT_APPROVE_PERMISSION
 *
 * Adds payment.import_approve permission assigned to RT_CHAIR.
 *
 * Separation of concerns:
 *   - payment.approve (RT_ADMIN, TREASURER): approve individual payment
 *     confirmations submitted by residents via the regular payment flow.
 *   - payment.import_approve (RT_CHAIR): approve bulk payment import batches
 *     created by Treasurer via the shared import framework.
 *
 * This mirrors the income/expense pattern where RT_CHAIR is the sole approver
 * of financial import batches.
 * =============================================================================
 */

-- Insert permission
INSERT INTO permissions (code, description)
VALUES (
    'payment.import_approve',
    'Approve bulk payment import batches'
)
ON CONFLICT (code) DO NOTHING;

-- Grant to RT_CHAIR
INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles       r
JOIN   permissions p ON p.code = 'payment.import_approve'
WHERE  r.code = 'RT_CHAIR'
ON CONFLICT (role_id, permission_id) DO UPDATE SET allow = true;
