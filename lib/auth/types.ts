/*
 * RBAC v2 — Authorization Types
 *
 * Single source of truth for permission codes and role codes used throughout
 * the application. These values mirror the seeded rows in the `permissions`
 * and `roles` database tables and must never be renamed after seeding.
 *
 * Reference: docs/database/PERMISSION_CATALOG.md
 */

/* -------------------------------------------------------------------------- */
/* Permissions                                                                 */
/* -------------------------------------------------------------------------- */

export const PERMISSION = {

  // Resident
  RESIDENT_VIEW:    'resident.view',
  RESIDENT_CREATE:  'resident.create',
  RESIDENT_UPDATE:  'resident.update',
  RESIDENT_DELETE:  'resident.delete',
  RESIDENT_APPROVE: 'resident.approve',
  RESIDENT_REJECT:  'resident.reject',

  // Membership
  MEMBERSHIP_VIEW:   'membership.view',
  MEMBERSHIP_CREATE: 'membership.create',
  MEMBERSHIP_UPDATE: 'membership.update',
  MEMBERSHIP_DELETE: 'membership.delete',

  // Payment
  PAYMENT_VIEW:    'payment.view',
  PAYMENT_CREATE:  'payment.create',
  PAYMENT_UPDATE:  'payment.update',
  PAYMENT_DELETE:  'payment.delete',
  PAYMENT_APPROVE: 'payment.approve',
  PAYMENT_REJECT:  'payment.reject',

  // Expense
  EXPENSE_VIEW:   'expense.view',
  EXPENSE_CREATE: 'expense.create',
  EXPENSE_UPDATE: 'expense.update',
  EXPENSE_DELETE: 'expense.delete',

  // Ledger
  LEDGER_VIEW:   'ledger.view',
  LEDGER_EXPORT: 'ledger.export',

  // Report
  REPORT_VIEW:   'report.view',
  REPORT_EXPORT: 'report.export',

  // Announcement
  ANNOUNCEMENT_VIEW:   'announcement.view',
  ANNOUNCEMENT_CREATE: 'announcement.create',
  ANNOUNCEMENT_UPDATE: 'announcement.update',
  ANNOUNCEMENT_DELETE: 'announcement.delete',

  // Event
  EVENT_VIEW:   'event.view',
  EVENT_CREATE: 'event.create',
  EVENT_UPDATE: 'event.update',
  EVENT_DELETE: 'event.delete',

  // Document
  DOCUMENT_VIEW:   'document.view',
  DOCUMENT_CREATE: 'document.create',
  DOCUMENT_UPDATE: 'document.update',
  DOCUMENT_DELETE: 'document.delete',

  // Settings
  SETTINGS_VIEW:   'settings.view',
  SETTINGS_UPDATE: 'settings.update',

  // User Management
  USER_VIEW:   'user.view',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',

  // Role Management
  ROLE_VIEW:   'role.view',
  ROLE_CREATE: 'role.create',
  ROLE_UPDATE: 'role.update',

  // Permission Management
  PERMISSION_VIEW:     'permission.view',
  PERMISSION_OVERRIDE: 'permission.override',

  // Audit
  AUDIT_VIEW: 'audit.view',

} as const

export type Permission = typeof PERMISSION[keyof typeof PERMISSION]

/* -------------------------------------------------------------------------- */
/* Role codes                                                                  */
/* -------------------------------------------------------------------------- */

export const ROLE_CODE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  RT_ADMIN:    'RT_ADMIN',
  RT_CHAIR:    'RT_CHAIR',
  TREASURER:   'TREASURER',
  SECRETARY:   'SECRETARY',
  RESIDENT:    'RESIDENT',
} as const

export type RoleCode = typeof ROLE_CODE[keyof typeof ROLE_CODE]

/* -------------------------------------------------------------------------- */
/* Shared utility type                                                         */
/* -------------------------------------------------------------------------- */

export type EffectivePermissions = ReadonlySet<Permission>
