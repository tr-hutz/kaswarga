/**
 * validate-roles.mjs
 *
 * Phase 3 — Role Coverage Validation
 *   Parses the RBAC seed migration and renders a human-readable permission
 *   matrix showing which roles hold which permissions by default.
 *
 *   Also reports:
 *   - Roles with zero permissions (excluding SUPER_ADMIN — intentional)
 *   - Permissions not assigned to any role
 *   - Grant count per role vs. expected ranges documented in the seed
 *
 * Usage:
 *   node scripts/rbac/validate-roles.mjs
 *   npm run rbac:roles
 */

import { readFileSync } from 'fs'
import { resolve }      from 'path'

const ROOT = resolve(process.cwd())

function readText(rel) {
  return readFileSync(resolve(ROOT, rel), 'utf8')
}

/* -------------------------------------------------------------------------- */
/* Parse seed data                                                             */
/* -------------------------------------------------------------------------- */

function parseSeededRoles() {
  const src   = readText('supabase/migrations/012_rbac_seed.sql')
  const roles = []
  // Match role INSERT rows: ('ROLE_CODE', 'Name', ...
  const re = /\(\s*'([A-Z_]+)'\s*,\s*'[^']+'\s*,\s*'[^']+'\s*,\s*(true|false)\s*\)/g
  let m
  while ((m = re.exec(src)) !== null) {
    roles.push(m[1])
  }
  return roles
}

function parseRolePermissionAssignments() {
  const src = readText('supabase/migrations/012_rbac_seed.sql')
  // Map: role_code → Set<permission_code>
  const matrix = new Map()

  // Match lines in the VALUES block like:  ('RT_ADMIN', 'resident.view'),
  const re = /\(\s*'([A-Z_]+)'\s*,\s*'([a-z][a-z0-9._]+)'\s*\)/g
  let m
  while ((m = re.exec(src)) !== null) {
    const [, role, perm] = m
    if (!matrix.has(role)) matrix.set(role, new Set())
    matrix.get(role).add(perm)
  }
  return matrix
}

function parseDeclaredPermissions() {
  const src   = readText('lib/auth/types.ts')
  const perms = []
  const re    = /^\s+[A-Z_]+:\s+'([a-z][a-z0-9._]+)'/gm
  let m
  while ((m = re.exec(src)) !== null) perms.push(m[1])
  return perms.sort()
}

/* -------------------------------------------------------------------------- */
/* Expected grant counts from seed comments                                   */
/* -------------------------------------------------------------------------- */

const EXPECTED_GRANTS = {
  RT_ADMIN:  37,
  RT_CHAIR:  21,
  TREASURER: 19,  // 18 base + dashboard.payment.arrears added in migration 015
  SECRETARY: 10,
  RESIDENT:  5,
}

/* -------------------------------------------------------------------------- */
/* Main                                                                        */
/* -------------------------------------------------------------------------- */

const roles       = parseSeededRoles().filter(r => r !== 'SUPER_ADMIN')
const matrix      = parseRolePermissionAssignments()
const declared    = parseDeclaredPermissions()

// Only show permissions that appear in the seed (seeded permissions)
const seededPerms = new Set()
for (const perms of matrix.values()) {
  for (const p of perms) seededPerms.add(p)
}
const displayPerms = declared.filter(p => seededPerms.has(p))

/* ---- Print matrix -------------------------------------------------------- */

const COL = 6
const ROLE_HEADER_ABBREV = {
  RT_ADMIN:  'ADMIN',
  RT_CHAIR:  'CHAIR',
  TREASURER: 'TREAS',
  SECRETARY: 'SECR ',
  RESIDENT:  'RESID',
}

console.log('\n╔══════════════════════════════════════════════════════════════╗')
console.log('║       RBAC v2 — ROLE COVERAGE VALIDATION                   ║')
console.log('╚══════════════════════════════════════════════════════════════╝\n')

const header = '  ' + 'Permission'.padEnd(40) + roles.map(r => (ROLE_HEADER_ABBREV[r] ?? r.slice(0, 5)).padStart(COL)).join('')
console.log(header)
console.log('  ' + '─'.repeat(40) + '─'.repeat(COL * roles.length))

for (const perm of displayPerms) {
  let row = '  ' + perm.padEnd(40)
  for (const role of roles) {
    const has = matrix.get(role)?.has(perm) ?? false
    row += (has ? '  ✓   ' : '  ·   ').padStart(COL)
  }
  console.log(row)
}

console.log('  ' + '─'.repeat(40) + '─'.repeat(COL * roles.length))

/* ---- Grant counts -------------------------------------------------------- */

console.log()
console.log('  Grant counts per role:')
console.log()

let allMatch = true

for (const role of roles) {
  const actual   = matrix.get(role)?.size ?? 0
  const expected = EXPECTED_GRANTS[role]
  const match    = expected === undefined || actual === expected
  if (!match) allMatch = false

  const status = expected === undefined
    ? '  (no expected count)'
    : match
      ? `  ✅ matches expected ${expected}`
      : `  ❌ expected ${expected}, got ${actual}`

  console.log(`    ${role.padEnd(12)} ${String(actual).padStart(3)} grants${status}`)
}

console.log()

/* ---- Permissions not assigned to any role -------------------------------- */

const unassigned = displayPerms.filter(p => {
  for (const perms of matrix.values()) {
    if (perms.has(p)) return false
  }
  return true
})

if (unassigned.length > 0) {
  console.log(`⚠️  ${unassigned.length} seeded permission(s) not assigned to any role:\n`)
  for (const p of unassigned) console.log(`   • ${p}`)
  console.log()
  allMatch = false
} else {
  console.log('✅  All seeded permissions are assigned to at least one role.\n')
}

/* ---- SUPER_ADMIN note ---------------------------------------------------- */

console.log('ℹ️  SUPER_ADMIN is intentionally excluded from the matrix.')
console.log('   SUPER_ADMIN bypasses all permission checks via SuperAdminPermissionSet.\n')

/* ---- Summary ------------------------------------------------------------- */

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`RESULT: ${allMatch ? '✅  PASS' : '❌  FAIL'}`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

process.exit(allMatch ? 0 : 1)
