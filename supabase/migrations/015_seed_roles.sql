/*
 * =============================================================================
 * 015_SEED_ROLES
 *
 * Seeds the default roles defined in DEFAULT_ROLE_MATRIX.md.
 *
 * All built-in roles are marked is_system = true.
 * System roles must not be deleted or renamed by operators.
 *
 * Idempotent: ON CONFLICT (code) DO NOTHING ensures re-runs are safe.
 * Existing rows are never overwritten so that operator customisations
 * (e.g. localised display names) survive re-execution.
 *
 * Dependencies : 011_rbac_roles
 * =============================================================================
 */

INSERT INTO roles (code, name, description, is_system)
VALUES
    ('SUPER_ADMIN', 'Super Admin',    'Platform-level administrator. Operates outside RT scope.',          true),
    ('RT_ADMIN',    'Administrator',  'Full RT administration.',                                           true),
    ('RT_CHAIR',    'Ketua',          'RT leader. Approves residents and oversees operations.',            true),
    ('TREASURER',   'Bendahara',      'Financial management. Approves payments and manages expenses.',     true),
    ('SECRETARY',   'Sekretaris',     'Administrative management. Handles documentation and residents.',   true),
    ('RESIDENT',    'Warga',          'Standard resident. Can view and submit payments.',                  true)
ON CONFLICT (code) DO NOTHING;
