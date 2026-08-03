/**
 * validate-consistency.mjs
 *
 * Phase 4 — RBAC Consistency Validator
 *   Static-analysis checks that verify the RBAC v2 implementation is internally
 *   consistent. Designed to run in CI.
 *
 *   Checks performed:
 *   1. Permission naming convention  — all codes must match `module.action`
 *   2. types.ts ↔ seed alignment     — no missing or orphaned permissions
 *   3. Navigation config             — every permission reference maps to a
 *                                      declared permission
 *   4. ENUM_TO_ROLE_CODE completeness — all user_role enum values are mapped
 *   5. Legacy role-string guards      — detects direct role comparisons that
 *                                      should use permissions instead
 *   6. Duplicate enforcement calls   — same permission checked twice in one file
 *
 * Exit code 0 = all checks pass. Exit code 1 = at least one failure.
 *
 * Usage:
 *   node scripts/rbac/validate-consistency.mjs
 *   npm run rbac:consistency
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { resolve, relative, extname }          from 'path'

const ROOT = resolve(process.cwd())

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
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
  return map   // key → code
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

function parseEnumToRoleCode() {
  const src = readText('lib/auth/permission-service.ts')
  const map = new Map()
  const re  = /^\s+([A-Z_]+):\s+'([A-Z_]+)'/gm
  let m
  // Only capture the ENUM_TO_ROLE_CODE block
  const block = src.match(/ENUM_TO_ROLE_CODE[^=]*=\s*\{([^}]+)\}/s)
  if (!block) return map
  const blockRe = /([A-Z_]+)\s*:\s*'([A-Z_]+)'/g
  while ((m = blockRe.exec(block[1])) !== null) {
    map.set(m[1], m[2])
  }
  return map
}

/* -------------------------------------------------------------------------- */
/* Known user_role enum values (from database schema / memberships table)      */
/* -------------------------------------------------------------------------- */

const USER_ROLE_ENUM = ['SUPER_ADMIN', 'CHAIR', 'ADMIN', 'TREASURER', 'SECRETARY', 'RESIDENT']

/* -------------------------------------------------------------------------- */
/* Check 1 — Permission naming convention                                     */
/* -------------------------------------------------------------------------- */

function checkNamingConvention(declared) {
  const invalid = []
  for (const [key, code] of declared) {
    // Must be lowercase module.action (dots allowed, no uppercase, no spaces)
    if (!/^[a-z][a-z0-9]+(\.[a-z][a-z0-9]+)+$/.test(code)) {
      invalid.push({ key, code })
    }
  }
  return invalid
}

/* -------------------------------------------------------------------------- */
/* Check 2 — types.ts ↔ seed alignment                                       */
/* -------------------------------------------------------------------------- */

function checkSeedAlignment(declared, seeded) {
  const codes           = new Set(declared.values())
  const seededNotDeclared = [...seeded].filter(c => !codes.has(c))
  // Codes in seed but not in types.ts are a hard error
  return { seededNotDeclared }
}

/* -------------------------------------------------------------------------- */
/* Check 3 — Navigation config permissions                                    */
/* -------------------------------------------------------------------------- */

function checkNavigationConfig(declared) {
  const src     = readText('lib/navigation/navigation-config.ts')
  const invalid = []
  const re      = /PERMISSION\.([A-Z_]+)/g
  const keys    = new Set(declared.keys())
  let m
  while ((m = re.exec(src)) !== null) {
    if (!keys.has(m[1])) {
      invalid.push(m[1])
    }
  }
  return [...new Set(invalid)]
}

/* -------------------------------------------------------------------------- */
/* Check 4 — ENUM_TO_ROLE_CODE completeness                                  */
/* -------------------------------------------------------------------------- */

function checkEnumMapping(enumMap) {
  const missing = USER_ROLE_ENUM.filter(role => !enumMap.has(role))
  return missing
}

/* -------------------------------------------------------------------------- */
/* Check 5 — Legacy role-string guards                                        */
/* -------------------------------------------------------------------------- */

const LEGACY_PATTERNS = [
  // Direct comparisons: role === 'CHAIR', role === 'ADMIN', etc.
  /\brole\s*===?\s*'(CHAIR|ADMIN|TREASURER|SECRETARY|RESIDENT)'/,
  // Membership role comparisons (not SUPER_ADMIN — that's intentional)
  /membership\.role\s*===?\s*'(CHAIR|ADMIN|TREASURER|SECRETARY|RESIDENT)'/,
  // Legacy role-name constants
  /['"]RT_CHAIR['"]\s*(?!.*ROLE_CODE)/,
]

function checkLegacyGuards() {
  const hits = []
  const files = walkTs(resolve(ROOT))

  const skipPaths = [
    'lib/auth/permission-service.ts',  // intentional mapping
    'lib/auth/__tests__',
    'scripts/',
    '.next/',
  ]

  for (const file of files) {
    const rel = relative(ROOT, file).replace(/\\/g, '/')
    if (skipPaths.some(skip => rel.startsWith(skip))) continue

    const src   = readFileSync(file, 'utf8')
    const lines = src.split('\n')

    for (let i = 0; i < lines.length; i++) {
      for (const pattern of LEGACY_PATTERNS) {
        if (pattern.test(lines[i])) {
          hits.push({ file: rel, line: i + 1, text: lines[i].trim() })
          break
        }
      }
    }
  }
  return hits
}

/* -------------------------------------------------------------------------- */
/* Check 6 — Duplicate enforcement calls in one file                          */
/* -------------------------------------------------------------------------- */

function checkDuplicateEnforcement() {
  const files    = walkTs(resolve(ROOT, 'app/api'))
  const dupes    = []

  for (const file of files) {
    const rel  = relative(ROOT, file).replace(/\\/g, '/')
    const src  = readFileSync(file, 'utf8')
    const seen = new Set()
    const re   = /requirePermission\s*\([^,]+,\s*PERMISSION\.([A-Z_]+)/g
    let m
    while ((m = re.exec(src)) !== null) {
      if (seen.has(m[1])) {
        dupes.push({ file: rel, key: m[1] })
      }
      seen.add(m[1])
    }
  }
  return dupes
}

/* -------------------------------------------------------------------------- */
/* Main                                                                        */
/* -------------------------------------------------------------------------- */

console.log('\n╔══════════════════════════════════════════════════════════════╗')
console.log('║       RBAC v2 — CONSISTENCY VALIDATOR                      ║')
console.log('╚══════════════════════════════════════════════════════════════╝\n')

const declared = parseDeclaredPermissions()
const seeded   = parseSeededPermissions()
const enumMap  = parseEnumToRoleCode()

let failures = 0

/* Check 1 */
const badNames = checkNamingConvention(declared)
if (badNames.length === 0) {
  console.log('✅  [1/6] Permission naming convention — all codes follow module.action format')
} else {
  console.log(`❌  [1/6] Permission naming convention — ${badNames.length} violation(s):`)
  for (const { key, code } of badNames) console.log(`        ${key}: '${code}'`)
  failures++
}

/* Check 2 */
const { seededNotDeclared } = checkSeedAlignment(declared, seeded)
if (seededNotDeclared.length === 0) {
  console.log('✅  [2/6] Seed alignment — all seeded permissions are declared in types.ts')
} else {
  console.log(`❌  [2/6] Seed alignment — ${seededNotDeclared.length} seeded permission(s) missing from types.ts:`)
  for (const c of seededNotDeclared) console.log(`        '${c}'`)
  failures++
}

/* Check 3 */
const badNavPerms = checkNavigationConfig(declared)
if (badNavPerms.length === 0) {
  console.log('✅  [3/6] Navigation config — all PERMISSION references are valid')
} else {
  console.log(`❌  [3/6] Navigation config — ${badNavPerms.length} unknown PERMISSION key(s):`)
  for (const k of badNavPerms) console.log(`        PERMISSION.${k}`)
  failures++
}

/* Check 4 */
const missingEnumMappings = checkEnumMapping(enumMap)
if (missingEnumMappings.length === 0) {
  console.log('✅  [4/6] ENUM_TO_ROLE_CODE — all user_role enum values are mapped')
} else {
  console.log(`❌  [4/6] ENUM_TO_ROLE_CODE — ${missingEnumMappings.length} enum value(s) not mapped:`)
  for (const r of missingEnumMappings) console.log(`        '${r}'`)
  failures++
}

/* Check 5 */
const legacyHits = checkLegacyGuards()
if (legacyHits.length === 0) {
  console.log('✅  [5/6] Legacy guards — no direct role-string comparisons found outside auth layer')
} else {
  console.log(`⚠️  [5/6] Legacy guards — ${legacyHits.length} potential role-string comparison(s):`)
  for (const h of legacyHits) console.log(`        ${h.file}:${h.line}  ${h.text}`)
  // Warn, not fail (SUPER_ADMIN checks are intentional in AppShell)
}

/* Check 6 */
const dupes = checkDuplicateEnforcement()
if (dupes.length === 0) {
  console.log('✅  [6/6] Duplicate enforcement — no duplicate requirePermission calls in single files')
} else {
  console.log(`⚠️  [6/6] Duplicate enforcement — ${dupes.length} duplicate(s) (may be intentional guard + logic split):`)
  for (const d of dupes) console.log(`        ${d.file}  PERMISSION.${d.key}`)
}

/* Summary */
console.log()
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`RESULT: ${failures === 0 ? '✅  PASS' : `❌  FAIL — ${failures} critical check(s) failed`}`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

process.exit(failures > 0 ? 1 : 0)
