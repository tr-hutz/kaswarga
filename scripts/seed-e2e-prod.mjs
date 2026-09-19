/**
 * seed-e2e-prod.mjs  —  ONE-TIME setup
 *
 * Creates the permanent E2E test RT, five test-payer residents,
 * and four test user accounts (Admin, Ketua, Bendahara, Warga) with
 * their memberships in the target environment.
 *
 * Safe to re-run — all operations are idempotent.
 * Run this ONCE before executing the first  npm run test:e2e:prod  session.
 *
 * Usage:
 *   npm run seed:e2e:prod:setup            # reads .env.e2e
 *   APP_ENV=preview npm run seed:e2e:prod:setup  # reads .env.preview
 *
 * Required env vars (in .env.e2e):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   E2E_ADMIN_EMAIL      / E2E_ADMIN_PASSWORD
 *   E2E_CHAIR_EMAIL      / E2E_CHAIR_PASSWORD
 *   E2E_TREASURER_EMAIL  / E2E_TREASURER_PASSWORD
 *   E2E_RESIDENT_EMAIL   / E2E_RESIDENT_PASSWORD
 */

import { createClient } from '@supabase/supabase-js'
import { loadEnv } from './load-env.mjs'

loadEnv('.env.production')
const envFile = process.env.APP_ENV === 'preview' ? '.env.preview' : '.env.production.e2e'
loadEnv(envFile)

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ---------------------------------------------------------------------------
// Fixed IDs — stable across all runs and environments
// ---------------------------------------------------------------------------
export const E2E_RT_ID = 'e2e00000-0000-0000-0000-000000000000'

// Test payer residents — plain resident records, no auth accounts.
// Used as resident_id in payment_confirmations seeded by global-setup.prod.ts.
export const E2E_RES = {
  R1: 'e2e00000-0000-0000-0001-000000000001',
  R2: 'e2e00000-0000-0000-0001-000000000002',
  R3: 'e2e00000-0000-0000-0001-000000000003',
  R4: 'e2e00000-0000-0000-0001-000000000004',
  R5: 'e2e00000-0000-0000-0001-000000000005',
}

// Resident records for the test staff users (linked to their auth accounts).
// IDs are fixed so global-setup.prod.ts can reference them without a DB lookup.
export const E2E_STAFF_RES = {
  ADMIN:     'e2e00000-0000-0000-0002-000000000001',
  CHAIR:     'e2e00000-0000-0000-0002-000000000002',
  TREASURER: 'e2e00000-0000-0000-0002-000000000003',
  RESIDENT:  'e2e00000-0000-0000-0002-000000000004',
}

const TEST_USERS = [
  { envEmail: 'E2E_ADMIN_EMAIL',     envPass: 'E2E_ADMIN_PASSWORD',     role: 'ADMIN',     label: 'Admin',     resId: E2E_STAFF_RES.ADMIN     },
  { envEmail: 'E2E_CHAIR_EMAIL',     envPass: 'E2E_CHAIR_PASSWORD',     role: 'CHAIR',     label: 'Ketua',     resId: E2E_STAFF_RES.CHAIR     },
  { envEmail: 'E2E_TREASURER_EMAIL', envPass: 'E2E_TREASURER_PASSWORD', role: 'TREASURER', label: 'Bendahara', resId: E2E_STAFF_RES.TREASURER },
  { envEmail: 'E2E_RESIDENT_EMAIL',  envPass: 'E2E_RESIDENT_PASSWORD',  role: 'RESIDENT',  label: 'Warga',     resId: E2E_STAFF_RES.RESIDENT  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function upsertById(table, rows) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' })
  if (error) throw new Error(`[upsert ${table}] ${error.message}`)
}

async function ensureUser(email, password, label) {
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listErr) throw new Error(`[listUsers] ${listErr.message}`)

  const existing = list?.users?.find(u => u.email === email)
  if (existing) {
    console.log(`  -  ${label} (${email}) — already exists  (${existing.id})`)
    return existing.id
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw new Error(`[createUser ${label}] ${error.message}`)
  console.log(`  ✓  ${label} (${email}) — created  (${data.user.id})`)
  return data.user.id
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log(`\nSupabase: ${SUPABASE_URL}  [${envFile}]`)
console.log('=== E2E prod setup (one-time) ===\n')

try {
  // 1. Test RT
  await upsertById('rt', [{
    id:          E2E_RT_ID,
    name:        '[E2E Test RT]',
    code:        'E2ETEST',
    address:     'Jl. E2E Test No. 0',
    city:        'Jakarta',
    province:    'DKI Jakarta',
    postal_code: '00000',
    monthly_fee: 50000,
    active:      true,
  }])
  console.log(`✓  Test RT  (${E2E_RT_ID})`)

  // 2. Test payer residents (no auth accounts)
  await upsertById('residents', [
    { id: E2E_RES.R1, rt_id: E2E_RT_ID, name: 'E2E Warga Satu',  phone: '08100000001' },
    { id: E2E_RES.R2, rt_id: E2E_RT_ID, name: 'E2E Warga Dua',   phone: '08100000002' },
    { id: E2E_RES.R3, rt_id: E2E_RT_ID, name: 'E2E Warga Tiga',  phone: '08100000003' },
    { id: E2E_RES.R4, rt_id: E2E_RT_ID, name: 'E2E Warga Empat', phone: '08100000004' },
    { id: E2E_RES.R5, rt_id: E2E_RT_ID, name: 'E2E Warga Lima',  phone: '08100000005' },
  ])
  console.log(`✓  5 test payer residents`)

  // 3. Auth users + resident records + memberships
  console.log('\nCreating test users...')
  for (const u of TEST_USERS) {
    const email    = process.env[u.envEmail]
    const password = process.env[u.envPass]
    if (!email || !password) {
      throw new Error(`Missing env vars: ${u.envEmail} / ${u.envPass}`)
    }

    const userId = await ensureUser(email, password, u.label)

    await upsertById('users', [{
      id:    userId,
      name:  `E2E ${u.label}`,
      email: email,
    }])

    await upsertById('residents', [{
      id:    u.resId,
      rt_id: E2E_RT_ID,
      name:  `E2E ${u.label}`,
      phone: null,
    }])

    const { error: memErr } = await supabase.from('memberships').upsert({
      rt_id:       E2E_RT_ID,
      user_id:     userId,
      resident_id: u.resId,
      role:        u.role,
      status:      'active',
    }, { onConflict: 'user_id,rt_id' })
    if (memErr) throw new Error(`[membership ${u.label}] ${memErr.message}`)

    console.log(`  ✓  ${u.label} linked to test RT`)
  }

  console.log('\n✓  E2E prod setup complete.')
  console.log(`   Run:  npm run test:e2e:prod\n`)
} catch (err) {
  console.error('\nSetup failed:', err.message)
  process.exit(1)
}
