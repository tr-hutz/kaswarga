/**
 * analyze-coverage.mjs
 *
 * Phase 1 — Permission Coverage Analyzer
 *   Shows every permission declared in types.ts and where it is enforced
 *   (API routes, lib/services, navigation config).
 *
 * Phase 2 — Dead Permission Detection
 *   Reports permissions that are declared but never referenced in any
 *   enforcement point, and permissions in the seed that are missing from
 *   types.ts (or vice versa).
 *
 * Usage:
 *   node scripts/rbac/analyze-coverage.mjs
 *   npm run rbac:audit
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
/* Parse declarations from lib/auth/types.ts                                  */
/* -------------------------------------------------------------------------- */

function parseDeclaredPermissions() {
  const src   = readText('lib/auth/types.ts')
  const perms = []
  // Match lines like:   KEY: 'some.code',
  const re = /^\s+[A-Z_]+:\s+'([a-z][a-z0-9._]+)'/gm
  let m
  while ((m = re.exec(src)) !== null) {
    perms.push(m[1])
  }
  return perms
}

/* -------------------------------------------------------------------------- */
/* Parse seeded permissions from 012_rbac_seed.sql                            */
/* -------------------------------------------------------------------------- */

function parseSeededPermissions() {
  const src   = readText('supabase/migrations/012_rbac_seed.sql')
  const perms = []
  // Match INSERT rows like  ('resident.view', ...
  const re = /\(\s*'([a-z][a-z0-9._]+)'\s*,/g
  let m
  while ((m = re.exec(src)) !== null) {
    const code = m[1]
    // Skip role codes (all uppercase) and other non-permission strings
    if (code.includes('.')) perms.push(code)
  }
  return [...new Set(perms)]
}

/* -------------------------------------------------------------------------- */
/* Collect all enforcement points                                              */
/* -------------------------------------------------------------------------- */

function collectEnforcementPoints() {
  const allFiles = walkTs(resolve(ROOT))
  // Map: permission code → list of relative file paths
  const usageMap = new Map()

  const skipPaths = [
    'lib/auth/types.ts',
    'lib/auth/__tests__',
    'scripts/',
    '.next/',
  ]

  for (const file of allFiles) {
    const rel = relative(ROOT, file).replace(/\\/g, '/')
    if (skipPaths.some(skip => rel.startsWith(skip))) continue

    const src = readFileSync(file, 'utf8')
    // Match PERMISSION.KEY_NAME patterns
    const re = /PERMISSION\.([A-Z_]+)/g
    let m
    while ((m = re.exec(src)) !== null) {
      const key = m[1]
      if (!usageMap.has(key)) usageMap.set(key, new Set())
      usageMap.get(key).add(rel)
    }
  }

  return usageMap
}

/* -------------------------------------------------------------------------- */
/* Resolve PERMISSION key → code                                              */
/* -------------------------------------------------------------------------- */

function buildKeyToCode() {
  const src = readText('lib/auth/types.ts')
  const map = new Map()
  const re  = /^\s+([A-Z_]+):\s+'([a-z][a-z0-9._]+)'/gm
  let m
  while ((m = re.exec(src)) !== null) {
    map.set(m[1], m[2])
  }
  return map
}

/* -------------------------------------------------------------------------- */
/* Main                                                                        */
/* -------------------------------------------------------------------------- */

const declared  = parseDeclaredPermissions()
const seeded    = parseSeededPermissions()
const keyToCode = buildKeyToCode()
const usageMap  = collectEnforcementPoints()

// Build reverse: code → key
const codeToKey = new Map([...keyToCode].map(([k, v]) => [v, k]))

/* ---- Phase 1: Coverage report ------------------------------------------- */

console.log('\n╔══════════════════════════════════════════════════════════════╗')
console.log('║       RBAC v2 — PERMISSION COVERAGE ANALYZER               ║')
console.log('╚══════════════════════════════════════════════════════════════╝\n')

console.log(`Declared permissions (lib/auth/types.ts): ${declared.length}`)
console.log(`Seeded permissions  (012_rbac_seed.sql):  ${seeded.length}\n`)

console.log('┌─────────────────────────────────────┬────────┬────────────────┐')
console.log('│ Permission code                     │ Seeded │ Enforced in    │')
console.log('├─────────────────────────────────────┼────────┼────────────────┤')

let coveredCount  = 0
let unseededCount = 0
let unusedCount   = 0

for (const code of declared.sort()) {
  const key     = codeToKey.get(code) ?? ''
  const files   = usageMap.get(key) ?? new Set()
  const isSeeded   = seeded.includes(code)
  const isEnforced = files.size > 0

  const seededLabel   = isSeeded   ? '   ✓   ' : '   ✗   '
  const enforcedLabel = isEnforced
    ? `${files.size} file${files.size > 1 ? 's' : ''}       `
    : '—               '

  const prefix = !isSeeded   ? ' ⚠' : (isEnforced ? '  ' : ' ·')
  console.log(`│${prefix} ${code.padEnd(35)} │${seededLabel} │ ${enforcedLabel.slice(0, 14)} │`)

  if (isEnforced) coveredCount++
  if (!isSeeded)  unseededCount++
  if (!isEnforced) unusedCount++
}

console.log('└─────────────────────────────────────┴────────┴────────────────┘\n')

/* ---- Phase 2: Dead permission detection ---------------------------------- */

console.log('╔══════════════════════════════════════════════════════════════╗')
console.log('║       RBAC v2 — DEAD PERMISSION DETECTION                  ║')
console.log('╚══════════════════════════════════════════════════════════════╝\n')

// Permissions declared in types.ts but never referenced in code
const dead = declared.filter(code => {
  const key = codeToKey.get(code)
  return !key || !usageMap.has(key)
})

if (dead.length === 0) {
  console.log('✅  No dead permissions detected — all declared permissions are referenced in code.\n')
} else {
  console.log(`⚠️  ${dead.length} permission(s) declared but never enforced in code:\n`)
  for (const code of dead) {
    console.log(`   • ${code}`)
  }
  console.log()
}

// Permissions in seed but not in types.ts
const seededNotDeclared = seeded.filter(code => !declared.includes(code))
if (seededNotDeclared.length > 0) {
  console.log(`⚠️  ${seededNotDeclared.length} seeded permission(s) missing from lib/auth/types.ts:\n`)
  for (const code of seededNotDeclared) {
    console.log(`   • ${code}`)
  }
  console.log()
} else {
  console.log('✅  All seeded permissions are declared in lib/auth/types.ts.\n')
}

// Permissions in types.ts but not in seed
const declaredNotSeeded = declared.filter(code => !seeded.includes(code))
if (declaredNotSeeded.length > 0) {
  console.log(`ℹ️  ${declaredNotSeeded.length} declared permission(s) not present in 012_rbac_seed.sql:`)
  console.log('   (These are valid future permissions or RT-Management-only permissions.)\n')
  for (const code of declaredNotSeeded) {
    console.log(`   • ${code}`)
  }
  console.log()
} else {
  console.log('✅  All declared permissions are present in the seed.\n')
}

/* ---- Summary ------------------------------------------------------------- */

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('SUMMARY')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`  Total declared permissions : ${declared.length}`)
console.log(`  Enforced in code           : ${coveredCount}`)
console.log(`  Not enforced (unused)      : ${unusedCount}`)
console.log(`  Declared but not seeded    : ${declaredNotSeeded.length}`)
console.log(`  Seeded but not declared    : ${seededNotDeclared.length}`)
console.log(`  Dead (declared + unused)   : ${dead.length}`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

const hasIssues = seededNotDeclared.length > 0
process.exit(hasIssues ? 1 : 0)
