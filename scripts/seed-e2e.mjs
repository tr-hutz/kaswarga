/**
 * seed-e2e.mjs
 *
 * Seeds minimal test data for E2E payment and expense tests.
 * Uses fixed UUIDs so it is safe to re-run between test sessions.
 *
 * What it seeds (all in RT 01 — the RT used by every E2E session):
 *   - 5 payment_confirmations  (3 pending, 1 approved, 1 rejected)
 *   - 5 confirmation_details   (one per confirmation)
 *   - 5 expenses               (3 pending, 1 approved, 1 rejected)
 *   - 2 income_donations       (1 DRAFT, 1 ACTIVE)
 *   - 2 income_transactions    (1 pending OTHER, 1 pending DONATION)
 *
 * Before inserting, it removes stale payments and ledger entries that were
 * created during previous E2E test runs (approve/reject actions).
 * Status is then reset to its seed state via upsert so each test run starts
 * from a known baseline.
 *
 * Usage:
 *   npm run seed:e2e                   # targets .env.local  (default)
 *   APP_ENV=preview npm run seed:e2e   # targets .env.preview (staging/CI)
 *
 * Do NOT run against production — this script inserts test data.
 */

import { createClient } from '@supabase/supabase-js'
import { loadEnv } from './load-env.mjs'

const envFile = process.env.APP_ENV === 'preview' ? '.env.preview' : '.env.local'
loadEnv(envFile)

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
// rudi@example.com — CHAIR in RT 01, used in chair.json
const CHAIR     = 'cccccccc-cccc-cccc-cccc-cccccccccc11'

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
// income_donations  (1 DRAFT + 1 ACTIVE)
//
// DRAFT  — treasurer/chair tests: row exists in donation list, drawer opens,
//          chair sees Aktifkan button.  Upsert resets status back to DRAFT after
//          each activation test so the next run starts clean.
//
// ACTIVE — banner tests (resident Beranda, treasurer Dasbor, chair maker-checker).
//          A seeded ACTIVE donation guarantees the banner is always visible.
// ---------------------------------------------------------------------------
const INCOME_DONATIONS = [
  {
    id:            'e2eb0001-e2eb-e2eb-e2eb-e2eb00000001',
    rt_id:         RT_ID,
    name:          'E2E Donasi Draf',
    donation_code: 'E2E-DRAF-001',
    description:   'Data uji E2E — DRAFT donation for list/activation tests',
    target_amount: 1000000,
    starts_at:     '2026-07-01',
    status:        'DRAFT',
    created_by:    TREASURER,
    created_at:    '2026-07-01T08:00:00Z',
    updated_at:    '2026-07-01T08:00:00Z',
  },
  {
    id:            'e2eb0001-e2eb-e2eb-e2eb-e2eb00000002',
    rt_id:         RT_ID,
    name:          'E2E Donasi Aktif',
    donation_code: 'E2E-AKTIF-001',
    description:   'Data uji E2E — ACTIVE donation for banner tests',
    target_amount: 5000000,
    starts_at:     '2026-07-01',
    status:        'ACTIVE',
    created_by:    TREASURER,
    created_at:    '2026-07-01T08:00:00Z',
    updated_at:    '2026-07-01T08:00:00Z',
  },
]

// ---------------------------------------------------------------------------
// income_transactions  (1 pending OTHER + 1 pending DONATION)
//
// pending OTHER   — chair income page test: rowCount > 0 → edit/delete buttons
//                   must not appear for CHAIR role.
//
// pending DONATION (submitted by CHAIR) — treasurer checker test: TREASURER
//                   opens the row and sees Setujui/Tolak because it was not
//                   submitted by them.  Also satisfies maker-checker row check.
// ---------------------------------------------------------------------------
const INCOME_TXS = [
  {
    id:              'e2ef0001-e2ef-e2ef-e2ef-e2ef00000001',
    rt_id:           RT_ID,
    income_category: 'OTHER',
    income_name:     'E2E Pemasukan Lainnya 1',
    source_type:     'ANONYMOUS',
    is_anonymous:    true,
    amount:          500000,
    received_at:     '2026-07-01',
    status:          'pending',
    created_by:      TREASURER,
    created_at:      '2026-07-01T08:00:00Z',
    updated_at:      '2026-07-01T08:00:00Z',
  },
  {
    id:              'e2ef0001-e2ef-e2ef-e2ef-e2ef00000002',
    rt_id:           RT_ID,
    income_category: 'DONATION',
    income_name:     'E2E Donasi Resident 1',
    source_type:     'RESIDENT',
    resident_id:     R13,
    is_anonymous:    false,
    amount:          50000,
    received_at:     '2026-07-01',
    status:          'pending',
    donation_id:     'e2eb0001-e2eb-e2eb-e2eb-e2eb00000002',
    created_by:      CHAIR,
    created_at:      '2026-07-01T09:00:00Z',
    updated_at:      '2026-07-01T09:00:00Z',
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
console.log(`Supabase: ${SUPABASE_URL}  [${envFile}]`)
console.log('=== E2E seed: cleaning up stale test data ===\n')

try {
  // Remove stale payment_details + ledger + payments created when E2E tests
  // approved e2e confirmations in a previous run.  The e2e residents are R13–R17;
  // only payments for those residents (in RT_ID, year 2026) are removed so that
  // the rest of the dev-seed financial data is preserved.
  const { data: stalePayments } = await supabase
    .from('payments').select('id')
    .eq('rt_id', RT_ID)
    .in('resident_id', [R13, R14, R15, R16, R17])
  if (stalePayments?.length) {
    const ids = stalePayments.map(p => p.id)
    await supabase.from('payment_details').delete().in('payment_id', ids)
    await supabase.from('ledger').delete().in('reference_id', ids)
    await supabase.from('payments').delete().in('id', ids)
    console.log(`  ✓  removed ${stalePayments.length} stale payment(s) + ledger entries`)
  } else {
    console.log('  -  no stale payments found')
  }

  // Remove any ledger entries created when E2E tests approved expenses or
  // income_transactions (approve_expense / income approve writes ledger rows).
  const e2eRefIds = [
    ...EXPENSES.map(e => e.id),
    ...INCOME_TXS.map(t => t.id),
  ]
  const { count: ledgerDeleted } = await supabase
    .from('ledger').delete().in('reference_id', e2eRefIds)
  if (ledgerDeleted) {
    console.log(`  ✓  removed ${ledgerDeleted} stale ledger entry/entries for expenses/income`)
  }

  console.log('\n=== E2E seed: inserting / resetting test data ===\n')

  await upsert('payment_confirmations', CONFIRMATIONS)
  const pendingConf = CONFIRMATIONS.filter(r => r.status === 'pending').length
  console.log(`  ✓  ${CONFIRMATIONS.length} payment_confirmations  (${pendingConf} pending)`)

  await upsert('confirmation_details', DETAILS)
  console.log(`  ✓  ${DETAILS.length} confirmation_details`)

  await upsert('expenses', EXPENSES)
  const pendingExp = EXPENSES.filter(e => e.status === 'pending').length
  console.log(`  ✓  ${EXPENSES.length} expenses  (${pendingExp} pending)`)

  // income_donations must be upserted before income_transactions (FK dependency)
  await upsert('income_donations', INCOME_DONATIONS)
  const draftDon = INCOME_DONATIONS.filter(d => d.status === 'DRAFT').length
  const activeDon = INCOME_DONATIONS.filter(d => d.status === 'ACTIVE').length
  console.log(`  ✓  ${INCOME_DONATIONS.length} income_donations  (${draftDon} DRAFT, ${activeDon} ACTIVE)`)

  await upsert('income_transactions', INCOME_TXS)
  const pendingTx = INCOME_TXS.filter(t => t.status === 'pending').length
  console.log(`  ✓  ${INCOME_TXS.length} income_transactions  (${pendingTx} pending)`)

  console.log('\nE2E seed complete.')
  console.log(`  target env : ${envFile}`)
  console.log('  → payment drawer tests    (session.json   / ADMIN)      will pass')
  console.log('  → payment approval tests  (treasurer.json / TREASURER)  will pass')
  console.log('  → expense drawer tests    (session.json   / ADMIN)      will pass')
  console.log('  → income page tests       (chair.json     / CHAIR)       will pass')
  console.log('  → donation list tests     (treasurer.json / TREASURER)  will pass')
  console.log('  → donation activation     (chair.json     / CHAIR)       will pass')
  console.log('  → donation banner tests   (resident.json  / RESIDENT)    will pass')
  console.log('  → expense approval tests  skip: ADMIN role; only CHAIR can approve expenses')
} catch (err) {
  console.error('\nSeed failed:', err.message)
  process.exit(1)
}
