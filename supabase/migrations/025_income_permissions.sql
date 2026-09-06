/*
 * 029_income_permissions
 *
 * RBAC permissions for the Income Management module.
 *
 * Role matrix:
 *   RT_ADMIN  — view + create + update + delete + export + import (no approve/reject)
 *   RT_CHAIR  — view + approve + reject
 *   TREASURER — view + create + update + delete + export + import
 *   SECRETARY — view only
 *
 * Dependencies: 012_rbac_seed (roles and permissions tables)
 */


/* --------------------------------------------------------------------------
 * Permissions
 * -------------------------------------------------------------------------- */

INSERT INTO permissions (code, name, description, is_system) VALUES
    ('income.view',    'View Income',    'Access the Income module',           true),
    ('income.create',  'Create Income',  'Record a new income transaction',    true),
    ('income.update',  'Update Income',  'Edit a pending income transaction',  true),
    ('income.delete',  'Delete Income',  'Remove an income transaction',       true),
    ('income.approve', 'Approve Income', 'Approve a pending income record',    true),
    ('income.reject',  'Reject Income',  'Reject a pending income record',     true),
    ('income.export',  'Export Income',  'Export income data to Excel/CSV',    true),
    ('income.import',  'Import Income',  'Import income data from Excel',      true)
ON CONFLICT (code) DO NOTHING;


/* --------------------------------------------------------------------------
 * RT_ADMIN — view + create + update + delete + export + import
 * RT_ADMIN does NOT approve or reject income (RT_CHAIR responsibility).
 * -------------------------------------------------------------------------- */

INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles r
CROSS  JOIN permissions p
WHERE  r.code = 'RT_ADMIN'
  AND  p.code IN (
      'income.view',
      'income.create',
      'income.update',
      'income.delete',
      'income.export',
      'income.import'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;


/* --------------------------------------------------------------------------
 * RT_CHAIR — view + approve + reject
 * -------------------------------------------------------------------------- */

INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles r
CROSS  JOIN permissions p
WHERE  r.code = 'RT_CHAIR'
  AND  p.code IN (
      'income.view',
      'income.approve',
      'income.reject'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;


/* --------------------------------------------------------------------------
 * TREASURER — view + create + update + delete + export + import
 * -------------------------------------------------------------------------- */

INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles r
CROSS  JOIN permissions p
WHERE  r.code = 'TREASURER'
  AND  p.code IN (
      'income.view',
      'income.create',
      'income.update',
      'income.delete',
      'income.export',
      'income.import'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;


/* --------------------------------------------------------------------------
 * SECRETARY — view only
 * -------------------------------------------------------------------------- */

INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles r
CROSS  JOIN permissions p
WHERE  r.code = 'SECRETARY'
  AND  p.code IN ('income.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;
