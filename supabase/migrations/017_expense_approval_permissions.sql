/*
 * =============================================================================
 * 017_EXPENSE_APPROVAL_PERMISSIONS
 *
 * Corrects expense permission assignments introduced in 012_rbac_seed:
 *
 *   1. Adds missing expense.approve and expense.reject permissions
 *   2. Removes expense write permissions (create/update/delete) from RT_ADMIN
 *   3. Grants expense.approve and expense.reject to RT_CHAIR
 *
 * Business Rule:
 *   - TREASURER : may create/update/delete expenses
 *   - RT_CHAIR  : may approve/reject expenses
 *   - RT_ADMIN  : view only
 *
 * All statements are idempotent (ON CONFLICT DO NOTHING / DELETE WHERE EXISTS).
 *
 * Dependencies : 012_rbac_seed
 * =============================================================================
 */

-- 1. Add missing permissions
INSERT INTO permissions (code, name, description, is_system)
VALUES
    ('expense.approve', 'Approve Expense', 'Approve expense', true),
    ('expense.reject',  'Reject Expense',  'Reject expense',  true)
ON CONFLICT (code) DO NOTHING;

-- 2. Remove expense write permissions from RT_ADMIN
DELETE FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE code = 'RT_ADMIN')
  AND permission_id IN (
      SELECT id FROM permissions WHERE code IN ('expense.create', 'expense.update', 'expense.delete')
  );

-- 3. Grant expense.approve and expense.reject to RT_CHAIR
INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles       r
CROSS  JOIN permissions p
WHERE  r.code = 'RT_CHAIR'
  AND  p.code IN ('expense.approve', 'expense.reject')
ON CONFLICT (role_id, permission_id) DO NOTHING;
