/*
 * =============================================================================
 * 017_SEED_ROLE_PERMISSIONS
 *
 * Seeds the default role-permission assignments defined in DEFAULT_ROLE_MATRIX.md.
 *
 * Only granted (allow = true) rows are inserted.
 * A missing row is interpreted as Denied — the table stays lean.
 *
 * SUPER_ADMIN is intentionally excluded from this table.
 * SUPER_ADMIN operates at platform level and bypasses the permission
 * system via the application's is_super_admin() guard.
 *
 * Idempotent: ON CONFLICT (role_id, permission_id) DO NOTHING.
 *
 * Dependencies : 011_rbac_roles, 012_rbac_permissions,
 *                013_rbac_role_permissions,
 *                015_seed_roles, 016_seed_permissions
 * =============================================================================
 */

WITH assignments (role_code, permission_code) AS (
    VALUES

    -- -------------------------------------------------------------------------
    -- RT_ADMIN — full access to all permissions
    -- -------------------------------------------------------------------------
    ('RT_ADMIN', 'resident.view'),
    ('RT_ADMIN', 'resident.create'),
    ('RT_ADMIN', 'resident.update'),
    ('RT_ADMIN', 'resident.delete'),
    ('RT_ADMIN', 'resident.approve'),
    ('RT_ADMIN', 'resident.reject'),
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
    ('RT_ADMIN', 'expense.view'),
    ('RT_ADMIN', 'expense.create'),
    ('RT_ADMIN', 'expense.update'),
    ('RT_ADMIN', 'expense.delete'),
    ('RT_ADMIN', 'ledger.view'),
    ('RT_ADMIN', 'ledger.export'),
    ('RT_ADMIN', 'report.view'),
    ('RT_ADMIN', 'report.export'),
    ('RT_ADMIN', 'announcement.view'),
    ('RT_ADMIN', 'announcement.create'),
    ('RT_ADMIN', 'announcement.update'),
    ('RT_ADMIN', 'announcement.delete'),
    ('RT_ADMIN', 'event.view'),
    ('RT_ADMIN', 'event.create'),
    ('RT_ADMIN', 'event.update'),
    ('RT_ADMIN', 'event.delete'),
    ('RT_ADMIN', 'document.view'),
    ('RT_ADMIN', 'document.create'),
    ('RT_ADMIN', 'document.update'),
    ('RT_ADMIN', 'document.delete'),
    ('RT_ADMIN', 'settings.view'),
    ('RT_ADMIN', 'settings.update'),
    ('RT_ADMIN', 'user.view'),
    ('RT_ADMIN', 'user.create'),
    ('RT_ADMIN', 'user.update'),
    ('RT_ADMIN', 'user.delete'),
    ('RT_ADMIN', 'role.view'),
    ('RT_ADMIN', 'role.update'),
    ('RT_ADMIN', 'permission.view'),
    ('RT_ADMIN', 'permission.override'),
    ('RT_ADMIN', 'audit.view'),

    -- -------------------------------------------------------------------------
    -- RT_CHAIR (Ketua) — RT leadership; no financial write or user management
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
    ('RT_CHAIR', 'ledger.view'),
    ('RT_CHAIR', 'ledger.export'),
    ('RT_CHAIR', 'report.view'),
    ('RT_CHAIR', 'report.export'),
    ('RT_CHAIR', 'announcement.view'),
    ('RT_CHAIR', 'announcement.create'),
    ('RT_CHAIR', 'announcement.update'),
    ('RT_CHAIR', 'announcement.delete'),
    ('RT_CHAIR', 'event.view'),
    ('RT_CHAIR', 'event.create'),
    ('RT_CHAIR', 'event.update'),
    ('RT_CHAIR', 'event.delete'),
    ('RT_CHAIR', 'document.view'),
    ('RT_CHAIR', 'document.create'),
    ('RT_CHAIR', 'document.update'),
    ('RT_CHAIR', 'document.delete'),
    ('RT_CHAIR', 'settings.view'),
    ('RT_CHAIR', 'settings.update'),

    -- -------------------------------------------------------------------------
    -- TREASURER (Bendahara) — financial operations only
    -- -------------------------------------------------------------------------
    ('TREASURER', 'resident.view'),
    ('TREASURER', 'payment.view'),
    ('TREASURER', 'payment.create'),
    ('TREASURER', 'payment.update'),
    ('TREASURER', 'payment.delete'),
    ('TREASURER', 'payment.approve'),
    ('TREASURER', 'payment.reject'),
    ('TREASURER', 'expense.view'),
    ('TREASURER', 'expense.create'),
    ('TREASURER', 'expense.update'),
    ('TREASURER', 'expense.delete'),
    ('TREASURER', 'ledger.view'),
    ('TREASURER', 'ledger.export'),
    ('TREASURER', 'report.view'),
    ('TREASURER', 'report.export'),
    ('TREASURER', 'announcement.view'),
    ('TREASURER', 'event.view'),
    ('TREASURER', 'document.view'),

    -- -------------------------------------------------------------------------
    -- SECRETARY (Sekretaris) — administration and communication
    -- -------------------------------------------------------------------------
    ('SECRETARY', 'resident.view'),
    ('SECRETARY', 'resident.update'),
    ('SECRETARY', 'membership.view'),
    ('SECRETARY', 'report.view'),
    ('SECRETARY', 'report.export'),
    ('SECRETARY', 'announcement.view'),
    ('SECRETARY', 'announcement.create'),
    ('SECRETARY', 'announcement.update'),
    ('SECRETARY', 'event.view'),
    ('SECRETARY', 'event.create'),
    ('SECRETARY', 'event.update'),
    ('SECRETARY', 'document.view'),
    ('SECRETARY', 'document.create'),
    ('SECRETARY', 'document.update'),

    -- -------------------------------------------------------------------------
    -- RESIDENT (Warga) — read access and self-service payments
    -- -------------------------------------------------------------------------
    ('RESIDENT', 'resident.view'),
    ('RESIDENT', 'payment.view'),
    ('RESIDENT', 'payment.create'),
    ('RESIDENT', 'expense.view'),
    ('RESIDENT', 'ledger.view'),
    ('RESIDENT', 'announcement.view'),
    ('RESIDENT', 'event.view'),
    ('RESIDENT', 'document.view')
)
INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM assignments a
JOIN roles       r ON r.code = a.role_code
JOIN permissions p ON p.code = a.permission_code
ON CONFLICT (role_id, permission_id) DO NOTHING;
