INSERT INTO permissions (code, name, description, is_system)
VALUES (
    'rbac.debug.view',
    'View Authorization Debug',
    'Access the authorization debug panel',
    true
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'RT_ADMIN'
  AND p.code = 'rbac.debug.view'
ON CONFLICT (role_id, permission_id) DO NOTHING;
