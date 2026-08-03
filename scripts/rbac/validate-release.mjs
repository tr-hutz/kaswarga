/**
 * validate-release.mjs
 *
 * Phase 7 — RBAC Release Validation
 *   Pre-release gate that runs all RBAC v2 static-analysis checks in sequence.
 *   Designed to run in CI before a production deployment.
 *
 *   Passes (exit 0) only when every critical check succeeds.
 *   Fails (exit 1) on any critical failure.
 *
 *   Covers:
 *   ① Permission declaration integrity (types.ts vs seed alignment)
 *   ② Role-permission grant counts match documented expectations
 *   ③ Naming convention compliance for all permission codes
 *   ④ ENUM_TO_ROLE_CODE completeness
 *   ⑤ Navigation config references only declared permissions
 *   ⑥ No seeded permissions missing from TypeScript types
 *   ⑦ Enforcement coverage — every seeded permission is referenced in code
 *
 * Usage:
 *   node scripts/rbac/validate-release.mjs
 *   npm run rbac:release
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { resolve, relative, extname }          from 'path'

const ROOT = resolve(process.cwd())

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                              */
/* -------------------------------------------------------------------------- */

function readText(rel) {
  return readFileSync(resolve(ROOT, rel), 'utf8')
}

function walkTs(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry)
    const st   = statSync(full)
    if (st.isDirectory()) {
      if (['node_modules', '.next', 'dist', '.git'].includes(entry)) continue
      walkTs(full, files)
    } else if (st.isFile() && ['.ts', '.tsx'].includes(extname(entry))) {
      files.push(full)
    }
  }
  return files
}

/* -------------------------------------------------------------------------- */
/* Parsers                                                                     */
/* -------------------------------------------------------------------------- */

function parseDeclaredPermissions() {
  const src = readText('lib/auth/types.ts')
  const map = new Map()
  const re  = /^\s+([A-Z_]+):\s+'([a-z][a-z0-9._]+)'/gm
  let m
  while ((m = re.exec(src)) !== null) map.set(m[1], m[2])
  return map
}

function parseSeededPermissions() {
  const src   = readText('supabase/migrations/012_rbac_seed.sql')
  const perms = new Set()
  const re    = /\(\s*'([a-z][a-z0-9._]+)'\s*,/g
  let m
  while ((m = re.exec(src)) !== null) {
    if (m[1].includes('.')) perms.add(m[1])
  }
  return perms
}

function parseRoleGrants() {
  const src    = readText('supabase/migrations/012_rbac_seed.sql')
  const matrix = new Map()
  const re     = /\(\s*'([A-Z_]+)'\s*,\s*'([a-z][a-z0-9._]+)'\s*\)/g
  let m
  while ((m = re.exec(src)) !== null) {
    const [, role, perm] = m
    if (!matrix.has(role)) matrix.set(role, new Set())
    matrix.get(role).add(perm)
  }
  return matrix
}

function parseEnumToRoleCode() {
  const src   = readText('lib/auth/permission-service.ts')
  const map   = new Map()
  const block = src.match(/ENUM_TO_ROLE_CODE[^=]*=\s*\{([^}]+)\}/s)
  if (!block) return map
  const re = /([A-Z_]+)\s*:\s*'([A-Z_]+)'/g
  let m
  while ((m = re.exec(block[1])) !== null) map.set(m[1], m[2])
  return map
}

function collectEnforcedKeys() {
  const allFiles  = walkTs(resolve(ROOT))
  const enforced  = new Set()
  const skipPaths = ['lib/auth/types.ts', 'lib/auth/__tests__', 'scripts/', '.next/']

  for (const file of allFiles) {
    const rel = relative(ROOT, file).replace(/\\/g, '/')
    if (skipPaths.some(s => rel.startsWith(s))) continue
    const src = readFileSync(file, 'utf8')
    const re  = /PERMISSION\.([A-Z_]+)/g
    let m
    while ((m = re.exec(src)) !== null) enforced.add(m[1])
  }
  return enforced
}

/* -------------------------------------------------------------------------- */
/* Individual checks                                                           */
/* -------------------------------------------------------------------------- */

function check(label, fn) {
  const { pass, details } = fn()
  const icon = pass ? '✅' : '❌'
  console.log(`  ${icon}  ${label}`)
  if (!pass && details?.length) {
    for (const d of details) console.log(`         ${d}`)
  }
  return pass
}

/* -------------------------------------------------------------------------- */
/* Main                                                                        */
/* -------------------------------------------------------------------------- */

console.log('\n╔══════════════════════════════════════════════════════════════╗')
console.log('║       RBAC v2 — RELEASE VALIDATION                        ║')
console.log('╚══════════════════════════════════════════════════════════════╝\n')

const declared  = parseDeclaredPermissions()
const seeded    = parseSeededPermissions()
const roleGrants = parseRoleGrants()
const enumMap   = parseEnumToRoleCode()
const enforced  = collectEnforcedKeys()

const codes = new Set(declared.values())

const EXPECTED_GRANTS = {
  RT_ADMIN:  37,
  RT_CHAIR:  21,
  TREASURER: 19,
  SECRETARY: 10,
  RESIDENT:  5,
}

const USER_ROLE_ENUM = ['SUPER_ADMIN', 'CHAIR', 'ADMIN', 'TREASURER', 'SECRETARY', 'RESIDENT']

let allPass = true

/* ① Seeded permissions are declared in types.ts */
allPass = check(
  'Seeded permissions declared in types.ts',
  () => {
    const missing = [...seeded].filter(c => !codes.has(c))
    return {
      pass:    missing.length === 0,
      details: missing.map(c => `Missing: '${c}'`),
    }
  }
) && allPass

/* ② Permission naming convention */
allPass = check(
  'Permission codes follow module.action naming convention',
  () => {
    const invalid = [...declared.entries()]
      .filter(([, code]) => !/^[a-z][a-z0-9]+(\.[a-z][a-z0-9]+)+$/.test(code))
    return {
      pass:    invalid.length === 0,
      details: invalid.map(([k, c]) => `${k}: '${c}'`),
    }
  }
) && allPass

/* ③ Role grant counts */
allPass = check(
  'Role grant counts match documented expectations',
  () => {
    const mismatches = []
    for (const [role, expected] of Object.entries(EXPECTED_GRANTS)) {
      const actual = roleGrants.get(role)?.size ?? 0
      if (actual !== expected) {
        mismatches.push(`${role}: expected ${expected}, got ${actual}`)
      }
    }
    return { pass: mismatches.length === 0, details: mismatches }
  }
) && allPass

/* ④ ENUM_TO_ROLE_CODE completeness */
allPass = check(
  'ENUM_TO_ROLE_CODE maps all user_role enum values',
  () => {
    const missing = USER_ROLE_ENUM.filter(r => !enumMap.has(r))
    return {
      pass:    missing.length === 0,
      details: missing.map(r => `Unmapped enum value: '${r}'`),
    }
  }
) && allPass

/* ⑤ Navigation config uses only declared permissions */
allPass = check(
  'Navigation config references only declared permissions',
  () => {
    const src  = readText('lib/navigation/navigation-config.ts')
    const keys = new Set(declared.keys())
    const bad  = []
    const re   = /PERMISSION\.([A-Z_]+)/g
    let m
    while ((m = re.exec(src)) !== null) {
      if (!keys.has(m[1])) bad.push(`PERMISSION.${m[1]}`)
    }
    return { pass: bad.length === 0, details: [...new Set(bad)] }
  }
) && allPass

/* ⑥ No orphaned permissions in types.ts not in seed (informational — warns but does not fail) */
const declaredNotSeeded = [...codes].filter(c => !seeded.has(c))
if (declaredNotSeeded.length > 0) {
  console.log(`  ℹ️   ${declaredNotSeeded.length} declared permission(s) not in seed (future / SA-only):`)
  for (const c of declaredNotSeeded) console.log(`         • ${c}`)
}

/* ⑦ Seeded permissions referenced in application code (informational — does not block release) */
const codeToKey      = new Map([...declared].map(([k, v]) => [v, k]))
const noEnforcement  = [...seeded].filter(code => {
  const key = codeToKey.get(code)
  return !key || !enforced.has(key)
})
if (noEnforcement.length > 0) {
  console.log(`  ⚠️   ${noEnforcement.length} seeded permission(s) have no server-side enforcement in code:`)
  console.log('       (These may be enforced via UI-only gating or server actions not yet migrated.)')
  for (const c of noEnforcement) console.log(`         • ${c}`)
  console.log('       Run `npm run rbac:audit` for the full coverage report.')
} else {
  console.log('  ✅  All seeded permissions are referenced in application code')
}

/* ---- Final result -------------------------------------------------------- */

console.log()
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

if (allPass) {
  console.log('RESULT: ✅  ALL CHECKS PASSED — safe to release')
} else {
  console.log('RESULT: ❌  RELEASE BLOCKED — fix the failures listed above')
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

process.exit(allPass ? 0 : 1)
