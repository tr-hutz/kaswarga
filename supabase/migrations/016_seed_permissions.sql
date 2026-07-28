/*
 * =============================================================================
 * 016_SEED_PERMISSIONS
 *
 * Seeds the complete permission catalog defined in PERMISSION_CATALOG.md.
 *
 * Permission codes are immutable. Never rename a code after seeding.
 * If a capability changes, deprecate the old permission and add a new one.
 *
 * All built-in permissions are marked is_system = true.
 *
 * Idempotent: ON CONFLICT (code) DO NOTHING ensures re-runs are safe.
 *
 * Dependencies : 012_rbac_permissions
 * =============================================================================
 */

INSERT INTO permissions (code, name, description, is_system)
VALUES

    -- Resident
    ('resident.view',    'View Residents',              'View resident list',                    true),
    ('resident.create',  'Create Resident',             'Create resident',                       true),
    ('resident.update',  'Update Resident',             'Update resident information',           true),
    ('resident.delete',  'Delete Resident',             'Delete resident (soft delete only)',    true),
    ('resident.approve', 'Approve Resident',            'Approve resident registration',         true),
    ('resident.reject',  'Reject Resident',             'Reject resident registration',          true),

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

    -- Expense
    ('expense.view',    'View Expenses',                'View expenses',                         true),
    ('expense.create',  'Create Expense',               'Create expense',                        true),
    ('expense.update',  'Edit Expense',                 'Edit expense',                          true),
    ('expense.delete',  'Delete Expense',               'Delete expense (soft delete only)',     true),

    -- Ledger
    ('ledger.view',   'View Ledger',                    'View ledger',                           true),
    ('ledger.export', 'Export Ledger',                  'Export ledger',                         true),

    -- Report
    ('report.view',   'View Reports',                   'View reports',                          true),
    ('report.export', 'Export Reports',                 'Export reports',                        true),

    -- Announcement
    ('announcement.view',   'View Announcements',       'View announcements',                    true),
    ('announcement.create', 'Create Announcement',      'Create announcement',                   true),
    ('announcement.update', 'Update Announcement',      'Update announcement',                   true),
    ('announcement.delete', 'Delete Announcement',      'Delete announcement',                   true),

    -- Event
    ('event.view',   'View Events',                     'View events',                           true),
    ('event.create', 'Create Event',                    'Create event',                          true),
    ('event.update', 'Update Event',                    'Update event',                          true),
    ('event.delete', 'Delete Event',                    'Delete event',                          true),

    -- Document
    ('document.view',   'View Documents',               'View shared documents',                 true),
    ('document.create', 'Upload Document',              'Upload document',                       true),
    ('document.update', 'Update Document',              'Update document',                       true),
    ('document.delete', 'Delete Document',              'Delete document',                       true),

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
    ('role.update', 'Update Role',                      'Update role metadata (system only)',    true),

    -- Permission Management
    ('permission.view',     'View Permissions',         'View permissions',                      true),
    ('permission.override', 'Manage Permission Overrides', 'Manage RT permission overrides',    true),

    -- Audit
    ('audit.view', 'View Audit Logs',                   'View audit logs',                       true)

ON CONFLICT (code) DO NOTHING;
