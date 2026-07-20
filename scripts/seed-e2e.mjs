/**
 * seed-e2e.mjs
 *
 * Seeds minimal test data for E2E payment and expense tests.
 * Uses fixed UUIDs and upserts so it is safe to re-run between test sessions.
 *
 * What it seeds (all in RT 01 — the RT used by every E2E session):
 *   - 5 payment_confirmations  (3 pending, 1 approved, 1 rejected)
 *   - 5 confirmation_details   (one per confirmation)
 *   - 5 expenses               (3 pending, 1 approved, 1 rejected)
 *
 * After running approval/rejection E2E tests the pending records get consumed.
 * Re-running this script resets them back to 'pending' so the next test run
 * starts clean.
 *
 * Usage:
 *   npm run seed:e2e
 */

import { readFileSync } from 'fs'
import { resolve }      from 'path'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Load .env.local
// ---------------------------------------------------------------------------
function loadEnv(file) {
  try {
    const lines = readFileSync(resolve(process.cwd(), file), 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    // file not found — rely on environment variables
  }
}

loadEnv('.env.local')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing required env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ---------------------------------------------------------------------------
// Fixed reference data (mirrors seed-dev.mjs)
// ---------------------------------------------------------------------------

// RT 01 — used by session.json (budi/ADMIN) and treasurer.json (dewi/TREASURER)
const RT_ID     = '11111111-1111-1111-1111-111111111111'
// dewi@example.com — TREASURER in RT 01, used in treasurer.json
const TREASURER = 'cccccccc-cccc-cccc-cccc-cccccccccc12'

// RT 01 residents (non-named test users — safe to use as payers)
const R13 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb13' // Agus Setiawan
const R14 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb14' // Fitri Handayani
const R15 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb15' // Bambang Supriyanto
const R16 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb16' // Sri Wahyuni
const R17 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb17' // Wahyu Pratama

// ---------------------------------------------------------------------------
// payment_confirmations  (3 pending, 1 approved, 1 rejected)
// Fixed UUIDs — prefix e2ec identifies these as E2E seed records
// ---------------------------------------------------------------------------
const CONFIRMATIONS = [
  {
    id:           'e2ec0001-e2ec-e2ec-e2ec-e2ec00000001',
    resident_id:  R13,
    rt_id:        RT_ID,
    year:         2026,
    total_amount: 50000,
    status:       'pending',
    created_at:   '2026-07-01T08:00:00Z',
  },
  {
    id:           'e2ec0001-e2ec-e2ec-e2ec-e2ec00000002',
    resident_id:  R14,
    rt_id:        RT_ID,
    year:         2026,
    total_amount: 50000,
    status:       'pending',
    created_at:   '2026-07-01T09:00:00Z',
  },
  {
    id:           'e2ec0001-e2ec-e2ec-e2ec-e2ec00000003',
    resident_id:  R15,
    rt_id:        RT_ID,
    year:         2026,
    total_amount: 50000,
    status:       'pending',
    created_at:   '2026-07-01T10:00:00Z',
  },
  {
    id:           'e2ec0001-e2ec-e2ec-e2ec-e2ec00000004',
    resident_id:  R16,
    rt_id:        RT_ID,
    year:         2026,
    total_amount: 50000,
    status:       'approved',
    approved_at:  '2026-07-02T08:00:00Z',
    created_at:   '2026-07-01T11:00:00Z',
  },
  {
    id:               'e2ec0001-e2ec-e2ec-e2ec-e2ec00000005',
    resident_id:      R17,
    rt_id:            RT_ID,
    year:             2026,
    total_amount:     50000,
    status:           'rejected',
    rejected_at:      '2026-07-02T09:00:00Z',
    rejection_reason: 'Data uji E2E',
    created_at:       '2026-07-01T12:00:00Z',
  },
]

// ---------------------------------------------------------------------------
// confirmation_details  (one per confirmation)
// ---------------------------------------------------------------------------
const DETAILS = [
  { id: 'e2ed0001-e2ed-e2ed-e2ed-e2ed00000001', confirmation_id: 'e2ec0001-e2ec-e2ec-e2ec-e2ec00000001', resident_id: R13, year: 2026, month: 1, amount: 50000, created_at: '2026-07-01T08:00:00Z' },
  { id: 'e2ed0001-e2ed-e2ed-e2ed-e2ed00000002', confirmation_id: 'e2ec0001-e2ec-e2ec-e2ec-e2ec00000002', resident_id: R14, year: 2026, month: 2, amount: 50000, created_at: '2026-07-01T09:00:00Z' },
  { id: 'e2ed0001-e2ed-e2ed-e2ed-e2ed00000003', confirmation_id: 'e2ec0001-e2ec-e2ec-e2ec-e2ec00000003', resident_id: R15, year: 2026, month: 3, amount: 50000, created_at: '2026-07-01T10:00:00Z' },
  { id: 'e2ed0001-e2ed-e2ed-e2ed-e2ed00000004', confirmation_id: 'e2ec0001-e2ec-e2ec-e2ec-e2ec00000004', resident_id: R16, year: 2026, month: 4, amount: 50000, created_at: '2026-07-01T11:00:00Z' },
  { id: 'e2ed0001-e2ed-e2ed-e2ed-e2ed00000005', confirmation_id: 'e2ec0001-e2ec-e2ec-e2ec-e2ec00000005', resident_id: R17, year: 2026, month: 5, amount: 50000, created_at: '2026-07-01T12:00:00Z' },
]

// ---------------------------------------------------------------------------
// expenses  (3 pending, 1 approved, 1 rejected)
// created_by = TREASURER (dewi) — matches who creates expenses per business rules
// ---------------------------------------------------------------------------
const EXPENSES = [
  {
    id:          'e2ee0001-e2ee-e2ee-e2ee-e2ee00000001',
    rt_id:       RT_ID,
    date:        '2026-01-15',
    category:    'Kebersihan',
    amount:      150000,
    recipient:   'Vendor Uji E2E 1',
    description: 'Data uji E2E',
    active:      true,
    status:      'pending',
    created_by:  TREASURER,
    created_at:  '2026-01-15T08:00:00Z',
  },
  {
    id:          'e2ee0001-e2ee-e2ee-e2ee-e2ee00000002',
    rt_id:       RT_ID,
    date:        '2026-02-15',
    category:    'Keamanan',
    amount:      200000,
    recipient:   'Vendor Uji E2E 2',
    description: 'Data uji E2E',
    active:      true,
    status:      'pending',
    created_by:  TREASURER,
    created_at:  '2026-02-15T08:00:00Z',
  },
  {
    id:          'e2ee0001-e2ee-e2ee-e2ee-e2ee00000003',
    rt_id:       RT_ID,
    date:        '2026-03-15',
    category:    'Administrasi',
    amount:      100000,
    recipient:   'Vendor Uji E2E 3',
    description: 'Data uji E2E',
    active:      true,
    status:      'pending',
    created_by:  TREASURER,
    created_at:  '2026-03-15T08:00:00Z',
  },
  {
    id:          'e2ee0001-e2ee-e2ee-e2ee-e2ee00000004',
    rt_id:       RT_ID,
    date:        '2026-04-15',
    category:    'Kebersihan',
    amount:      175000,
    recipient:   'Vendor Uji E2E 4',
    description: 'Data uji E2E',
    active:      true,
    status:      'approved',
    created_by:  TREASURER,
    approved_at: '2026-04-16T08:00:00Z',
    created_at:  '2026-04-15T08:00:00Z',
  },
  {
    id:             'e2ee0001-e2ee-e2ee-e2ee-e2ee00000005',
    rt_id:          RT_ID,
    date:           '2026-05-15',
    category:       'Keamanan',
    amount:         225000,
    recipient:      'Vendor Uji E2E 5',
    description:    'Data uji E2E',
    active:         true,
    status:         'rejected',
    created_by:     TREASURER,
    rejection_note: 'Data uji E2E',
    created_at:     '2026-05-15T08:00:00Z',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function upsert(table, rows) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' })
  if (error) throw new Error(`[${table}] ${error.message}`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log(`Supabase: ${SUPABASE_URL}`)
console.log('=== E2E seed: inserting / resetting test data ===\n')

try {
  await upsert('payment_confirmations', CONFIRMATIONS)
  const pendingConf = CONFIRMATIONS.filter(r => r.status === 'pending').length
  console.log(`  ✓  ${CONFIRMATIONS.length} payment_confirmations  (${pendingConf} pending)`)

  await upsert('confirmation_details', DETAILS)
  console.log(`  ✓  ${DETAILS.length} confirmation_details`)

  await upsert('expenses', EXPENSES)
  const pendingExp = EXPENSES.filter(e => e.status === 'pending').length
  console.log(`  ✓  ${EXPENSES.length} expenses  (${pendingExp} pending)`)

  console.log('\nE2E seed complete.')
  console.log('  → payment drawer tests  (session.json  / ADMIN)     will pass')
  console.log('  → payment approval tests (treasurer.json / TREASURER) will pass')
  console.log('  → expense drawer tests  (session.json  / ADMIN)     will pass')
  console.log('  → expense approval tests skip: session.json is ADMIN; only CHAIR can approve expenses')
} catch (err) {
  console.error('\nSeed failed:', err.message)
  process.exit(1)
}
