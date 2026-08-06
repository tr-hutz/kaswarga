/*
 * =============================================================================
 * 012_RBAC_SEED
 *
 * Seeds the complete RBAC v2 default data in execution order:
 *   1. Roles           — 6 system roles
 *   2. Permissions     — 44 system permissions (module.action catalog)
 *   3. Role-Permission assignments — 95 default grants
 *
 * SUPER_ADMIN intentionally has no role_permissions rows.
 * It bypasses the permission system unconditionally via has_permission().
 *
 * All statements are idempotent (ON CONFLICT DO NOTHING).
 *
 * Dependencies : 011_rbac_tables
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * 1. ROLES
 * --------------------------------------------------------------------------- */

INSERT INTO roles (code, name, description, is_system)
VALUES
    ('SUPER_ADMIN', 'Super Admin',    'Administrator platform. Beroperasi di luar lingkup RT.',                    true),
    ('RT_ADMIN',    'Administrator',  'Administrator RT dengan akses penuh ke seluruh fitur.',               true),
    ('RT_CHAIR',    'Ketua',          'Ketua RT. Menyetujui warga dan mengawasi operasional.',               true),
    ('TREASURER',   'Bendahara',      'Bendahara RT. Mengelola pembayaran dan pengeluaran.',                 true),
    ('SECRETARY',   'Sekretaris',     'Sekretaris RT. Mengelola administrasi dan dokumentasi warga.',        true),
    ('RESIDENT',    'Warga',          'Warga RT. Dapat melihat informasi dan mengajukan pembayaran iuran.',  true)
ON CONFLICT (code) DO NOTHING;


/* ----------------------------------------------------------------------------
 * 2. PERMISSIONS  (44 total — module.action catalog)
 *
 * Codes are immutable. Never rename after seeding.
 * To change a capability: deprecate the old code and add a new one.
 * --------------------------------------------------------------------------- */

INSERT INTO permissions (code, name, description, is_system)
VALUES

    -- Resident
    ('resident.view',    'View Residents',              'View resident list',                    true),
    ('resident.create',  'Create Resident',             'Create resident',                       true),
    ('resident.update',  'Update Resident',             'Update resident information',           true),
    ('resident.delete',  'Delete Resident',             'Delete resident (soft delete only)',    true),
    ('resident.approve', 'Approve Resident',            'Approve resident registration',         true),
    ('resident.reject',  'Reject Resident',             'Reject resident registration',          true),
    ('resident.export',  'Export Resident',             'Export resident data',                  true),
    ('resident.import',  'Import Resident',             'Import resident data',                  true),

    -- Membership
    ('membership.view',   'View Memberships',           'View memberships',                      true),
    ('membership.create', 'Create Membership',          'Add membership',                        true),
    ('membership.update', 'Update Membership',          'Update membership',                     true),
    ('membership.delete', 'Delete Membership',          'Remove membership',                     true),

    -- Payment
    ('payment.view',    'View Payments',                'View payments',                         true),
    ('payment.create',  'Record Payment',               'Record payment',                        true),
    ('payment.update',  'Edit Payment',                 'Edit payment',                          true),
    ('payment.delete',  'Delete Payment',               'Delete payment (soft delete only)',     true),
    ('payment.approve', 'Approve Payment',              'Approve payment',                       true),
    ('payment.reject',  'Reject Payment',               'Reject payment',                        true),
    ('dashboard.payment.export',  'Export Payment',     'Export payment',                        true),
    ('dashboard.payment.arrears',  'Dashboard Payment Arrears',     'Dashboard payment arrears', true),

    -- Expense
    ('expense.view',    'View Expenses',                'View expenses',                         true),
    ('expense.create',  'Create Expense',               'Create expense',                        true),
    ('expense.update',  'Edit Expense',                 'Edit expense',                          true),
    ('expense.delete',  'Delete Expense',               'Delete expense (soft delete only)',     true),
    ('expense.approve', 'Approve Expense',              'Approve expense',                       true),
    ('expense.reject',  'Reject Expense',               'Reject expense',                        true),
    ('expense.export',  'Export Expense',               'Export expense',                        true),
    ('expense.import',  'Import Expense',               'Import expense',                        true),

    -- Ledger
    ('ledger.view',   'View Ledger',                    'View ledger',                           true),
    ('ledger.export', 'Export Ledger',                  'Export ledger',                         true),

    -- Report
    ('report.view',   'View Reports',                   'View reports',                          true),
    ('report.export', 'Export Reports',                 'Export reports',                        true),

    -- Settings
    ('settings.view',   'View Settings',                'View RT settings',                      true),
    ('settings.update', 'Update Settings',              'Update RT settings',                    true),

    -- User Management
    ('user.view',   'View Users',                       'View users',                            true),
    ('user.create', 'Create User',                      'Create user',                           true),
    ('user.update', 'Update User',                      'Update user',                           true),
    ('user.delete', 'Delete User',                      'Delete user',                           true),

    -- Role Management
    ('role.view',   'View Roles',                       'View roles',                            true),
    ('role.create', 'Create Role',                      'Create new roles',                      true),
    ('role.update', 'Update Role',                      'Update role metadata',                  true),

    -- Permission Management
    ('permission.view',     'View Permissions',         'View permissions',                      true),
    ('permission.update',   'Edit Permission Matrix',   'Edit global role-permission assignments', true),
    ('permission.override', 'Manage Permission Overrides', 'Manage RT permission overrides',    true),

    -- Audit
    ('audit.view', 'View Audit Logs',                   'View audit logs',                       true)

ON CONFLICT (code) DO NOTHING;


/* ----------------------------------------------------------------------------
 * 3. ROLE-PERMISSION ASSIGNMENTS  (95 grants)
 *
 * SUPER_ADMIN: intentionally excluded — bypasses the permission system
 *              unconditionally via the has_permission() SUPER_ADMIN guard.
 *
 *   RT_ADMIN   37 grants  (view-only for expenses)
 *   RT_CHAIR   22 grants  (leadership; approves/rejects expenses; no financial write)
 *   TREASURER  20 grants  (financial operations only)
 *   SECRETARY  10 grants  (administration and documentation)
 *   RESIDENT    6 grants  (read access and self-service payments)
 * --------------------------------------------------------------------------- */

WITH assignments (role_code, permission_code) AS (
    VALUES

    -- -------------------------------------------------------------------------
    -- RT_ADMIN — 37 grants (view-only for expenses; no expense write/approve/reject)
    -- -------------------------------------------------------------------------
    ('RT_ADMIN', 'resident.view'),
    ('RT_ADMIN', 'resident.create'),
    ('RT_ADMIN', 'resident.update'),
    ('RT_ADMIN', 'resident.delete'),
    ('RT_ADMIN', 'resident.approve'),
    ('RT_ADMIN', 'resident.reject'),
    ('RT_ADMIN', 'resident.export'),
    ('RT_ADMIN', 'resident.import'),
    ('RT_ADMIN', 'membership.view'),
    ('RT_ADMIN', 'membership.create'),
    ('RT_ADMIN', 'membership.update'),
    ('RT_ADMIN', 'membership.delete'),
    ('RT_ADMIN', 'payment.view'),
    ('RT_ADMIN', 'payment.create'),
    ('RT_ADMIN', 'payment.update'),
    ('RT_ADMIN', 'payment.delete'),
    ('RT_ADMIN', 'payment.approve'),
    ('RT_ADMIN', 'payment.reject'),
    ('RT_ADMIN', 'dashboard.payment.export'),
    ('RT_ADMIN', 'expense.view'),
    ('RT_ADMIN', 'ledger.view'),
    ('RT_ADMIN', 'ledger.export'),
    ('RT_ADMIN', 'report.view'),
    ('RT_ADMIN', 'report.export'),
    ('RT_ADMIN', 'settings.view'),
    ('RT_ADMIN', 'settings.update'),
    ('RT_ADMIN', 'user.view'),
    ('RT_ADMIN', 'user.create'),
    ('RT_ADMIN', 'user.update'),
    ('RT_ADMIN', 'user.delete'),
    ('RT_ADMIN', 'role.view'),
    ('RT_ADMIN', 'role.create'),
    ('RT_ADMIN', 'role.update'),
    ('RT_ADMIN', 'permission.view'),
    ('RT_ADMIN', 'permission.update'),
    ('RT_ADMIN', 'permission.override'),
    ('RT_ADMIN', 'audit.view'),

    -- -------------------------------------------------------------------------
    -- RT_CHAIR (Ketua) — 21 grants
    -- -------------------------------------------------------------------------
    ('RT_CHAIR', 'resident.view'),
    ('RT_CHAIR', 'resident.create'),
    ('RT_CHAIR', 'resident.update'),
    ('RT_CHAIR', 'resident.delete'),
    ('RT_CHAIR', 'resident.approve'),
    ('RT_CHAIR', 'resident.reject'),
    ('RT_CHAIR', 'membership.view'),
    ('RT_CHAIR', 'membership.create'),
    ('RT_CHAIR', 'membership.update'),
    ('RT_CHAIR', 'membership.delete'),
    ('RT_CHAIR', 'payment.view'),
    ('RT_CHAIR', 'payment.create'),
    ('RT_CHAIR', 'expense.view'),
    ('RT_CHAIR', 'expense.approve'),
    ('RT_CHAIR', 'expense.reject'),
    ('RT_CHAIR', 'ledger.view'),
    ('RT_CHAIR', 'ledger.export'),
    ('RT_CHAIR', 'report.view'),
    ('RT_CHAIR', 'report.export'),
    ('RT_CHAIR', 'settings.view'),
    ('RT_CHAIR', 'settings.update'),
    ('RT_CHAIR', 'audit.view'),

    -- -------------------------------------------------------------------------
    -- TREASURER (Bendahara) — 19 grants
    -- -------------------------------------------------------------------------
    ('TREASURER', 'resident.view'),
    ('TREASURER', 'payment.view'),
    ('TREASURER', 'payment.create'),
    ('TREASURER', 'payment.update'),
    ('TREASURER', 'payment.delete'),
    ('TREASURER', 'payment.approve'),
    ('TREASURER', 'payment.reject'),
    ('TREASURER', 'dashboard.payment.export'),
    ('TREASURER', 'dashboard.payment.arrears'),
    ('TREASURER', 'expense.view'),
    ('TREASURER', 'expense.create'),
    ('TREASURER', 'expense.update'),
    ('TREASURER', 'expense.delete'),
    ('TREASURER', 'expense.export'),
    ('TREASURER', 'expense.import'),
    ('TREASURER', 'ledger.view'),
    ('TREASURER', 'ledger.export'),
    ('TREASURER', 'report.view'),
    ('TREASURER', 'report.export'),
    ('TREASURER', 'audit.view'),

    -- -------------------------------------------------------------------------
    -- SECRETARY (Sekretaris) — 10 grants
    -- -------------------------------------------------------------------------
    ('SECRETARY', 'resident.view'),
    ('SECRETARY', 'resident.create'),
    ('SECRETARY', 'resident.update'),
    ('SECRETARY', 'resident.delete'),
    ('SECRETARY', 'payment.view'),
    ('SECRETARY', 'dashboard.payment.export'),
    ('SECRETARY', 'expense.view'),
    ('SECRETARY', 'membership.view'),
    ('SECRETARY', 'report.view'),
    ('SECRETARY', 'report.export'),

    -- -------------------------------------------------------------------------
    -- RESIDENT (Warga) — 6 grants
    -- -------------------------------------------------------------------------
    ('RESIDENT', 'resident.view'),
    ('RESIDENT', 'payment.view'),
    ('RESIDENT', 'payment.create'),
    ('RESIDENT', 'expense.view'),
    ('RESIDENT', 'ledger.view'),
    ('RESIDENT', 'audit.view')
)
INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM assignments a
JOIN roles       r ON r.code = a.role_code
JOIN permissions p ON p.code = a.permission_code
ON CONFLICT (role_id, permission_id) DO NOTHING;
