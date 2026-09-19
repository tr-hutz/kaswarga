/**
 * global-setup.prod.ts
 *
 * Runs before each production E2E test suite (playwright.config.prod.ts).
 *
 * 1. Cleans up transactional data left by previous runs (payments, ledger,
 *    confirmation_details, expenses, income_donations, income_transactions).
 *    The test RT, residents, and memberships are permanent and are NOT removed.
 *
 * 2. Reseeds the standard E2E test data set (same shape as seed-e2e.mjs)
 *    scoped to the dedicated production test RT.
 *
 * Prerequisite: run  npm run seed:e2e:prod:setup  once before the first run.
 */

import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Constants — must match seed-e2e-prod.mjs
// ---------------------------------------------------------------------------
const E2E_RT_ID = 'e2e00000-0000-0000-0000-000000000000'

// Test payer residents (created by seed-e2e-prod.mjs, never deleted here)
const R1 = 'e2e00000-0000-0000-0001-000000000001'
const R2 = 'e2e00000-0000-0000-0001-000000000002'
const R3 = 'e2e00000-0000-0000-0001-000000000003'
const R4 = 'e2e00000-0000-0000-0001-000000000004'
const R5 = 'e2e00000-0000-0000-0001-000000000005'

// Fixed IDs for transactional test data (same scheme as seed-e2e.mjs)
const CONF_IDS = [
  'e2ec0001-e2ec-e2ec-e2ec-e2ec00000001',
  'e2ec0001-e2ec-e2ec-e2ec-e2ec00000002',
  'e2ec0001-e2ec-e2ec-e2ec-e2ec00000003',
  'e2ec0001-e2ec-e2ec-e2ec-e2ec00000004',
  'e2ec0001-e2ec-e2ec-e2ec-e2ec00000005',
]

const CONFIRMATIONS = [
  { id: CONF_IDS[0], resident_id: R1, rt_id: E2E_RT_ID, year: 2026, total_amount: 50000, status: 'pending',  created_at: '2026-07-01T08:00:00Z' },
  { id: CONF_IDS[1], resident_id: R2, rt_id: E2E_RT_ID, year: 2026, total_amount: 50000, status: 'pending',  created_at: '2026-07-01T09:00:00Z' },
  { id: CONF_IDS[2], resident_id: R3, rt_id: E2E_RT_ID, year: 2026, total_amount: 50000, status: 'pending',  created_at: '2026-07-01T10:00:00Z' },
  { id: CONF_IDS[3], resident_id: R4, rt_id: E2E_RT_ID, year: 2026, total_amount: 50000, status: 'approved', approved_at: '2026-07-02T08:00:00Z', created_at: '2026-07-01T11:00:00Z' },
  { id: CONF_IDS[4], resident_id: R5, rt_id: E2E_RT_ID, year: 2026, total_amount: 50000, status: 'rejected', rejected_at: '2026-07-02T09:00:00Z', rejection_reason: 'Data uji E2E', created_at: '2026-07-01T12:00:00Z' },
]

const DETAILS = [
  { id: 'e2ed0001-e2ed-e2ed-e2ed-e2ed00000001', confirmation_id: CONF_IDS[0], resident_id: R1, year: 2026, month: 1, amount: 50000, created_at: '2026-07-01T08:00:00Z' },
  { id: 'e2ed0001-e2ed-e2ed-e2ed-e2ed00000002', confirmation_id: CONF_IDS[1], resident_id: R2, year: 2026, month: 2, amount: 50000, created_at: '2026-07-01T09:00:00Z' },
  { id: 'e2ed0001-e2ed-e2ed-e2ed-e2ed00000003', confirmation_id: CONF_IDS[2], resident_id: R3, year: 2026, month: 3, amount: 50000, created_at: '2026-07-01T10:00:00Z' },
  { id: 'e2ed0001-e2ed-e2ed-e2ed-e2ed00000004', confirmation_id: CONF_IDS[3], resident_id: R4, year: 2026, month: 4, amount: 50000, created_at: '2026-07-01T11:00:00Z' },
  { id: 'e2ed0001-e2ed-e2ed-e2ed-e2ed00000005', confirmation_id: CONF_IDS[4], resident_id: R5, year: 2026, month: 5, amount: 50000, created_at: '2026-07-01T12:00:00Z' },
]

const DONATION_IDS = [
  'e2eb0001-e2eb-e2eb-e2eb-e2eb00000001',
  'e2eb0001-e2eb-e2eb-e2eb-e2eb00000002',
]

const INCOME_TX_IDS = [
  'e2ef0001-e2ef-e2ef-e2ef-e2ef00000001',
  'e2ef0001-e2ef-e2ef-e2ef-e2ef00000002',
]

const EXPENSE_IDS = [
  'e2ee0001-e2ee-e2ee-e2ee-e2ee00000001',
  'e2ee0001-e2ee-e2ee-e2ee-e2ee00000002',
  'e2ee0001-e2ee-e2ee-e2ee-e2ee00000003',
  'e2ee0001-e2ee-e2ee-e2ee-e2ee00000004',
  'e2ee0001-e2ee-e2ee-e2ee-e2ee00000005',
]

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default async function globalSetup() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.\n' +
      'Copy .env.production.e2e to .env.e2e and fill in the values.'
    )
  }

  const db = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ----- Look up staff user IDs (needed for created_by fields) -----
  const { data: memberships, error: memErr } = await db
    .from('memberships')
    .select('user_id, role')
    .eq('rt_id', E2E_RT_ID)
    .in('role', ['CHAIR', 'TREASURER'])

  if (memErr) throw new Error(`[lookup memberships] ${memErr.message}`)

  const CHAIR_ID     = memberships?.find(m => m.role === 'CHAIR')?.user_id
  const TREASURER_ID = memberships?.find(m => m.role === 'TREASURER')?.user_id

  if (!CHAIR_ID || !TREASURER_ID) {
    throw new Error(
      'E2E test RT is missing chair or treasurer membership.\n' +
      'Run: npm run seed:e2e:prod:setup'
    )
  }

  // ----- Cleanup: transactional data only -----

  // Payments + details + ledger entries created when E2E tests approved confirmations
  const { data: stalePayments } = await db
    .from('payments').select('id')
    .eq('rt_id', E2E_RT_ID)
    .in('resident_id', [R1, R2, R3, R4, R5])

  if (stalePayments?.length) {
    const ids = stalePayments.map((p: { id: string }) => p.id)
    await db.from('payment_details').delete().in('payment_id', ids)
    await db.from('ledger').delete().in('reference_id', ids)
    await db.from('payments').delete().in('id', ids)
  }

  // Ledger entries written when E2E tests approved expenses / income_transactions
  await db.from('ledger').delete().in('reference_id', [...EXPENSE_IDS, ...INCOME_TX_IDS])

  // confirmation_details must be deleted before re-upserting confirmations
  // (upsert won't remove details for confirmations whose resident/status changed)
  await db.from('confirmation_details').delete().in('confirmation_id', CONF_IDS)

  // ----- Reseed -----

  const upsert = async (table: string, rows: object[]) => {
    const { error } = await db.from(table).upsert(rows, { onConflict: 'id' })
    if (error) throw new Error(`[upsert ${table}] ${error.message}`)
  }

  await upsert('payment_confirmations', CONFIRMATIONS)

  await upsert('confirmation_details', DETAILS)

  await upsert('expenses', [
    { id: EXPENSE_IDS[0], rt_id: E2E_RT_ID, date: '2026-01-15', category: 'Kebersihan',   amount: 150000, recipient: 'Vendor E2E 1', description: 'Data uji E2E', active: true, status: 'pending',  created_by: TREASURER_ID, created_at: '2026-01-15T08:00:00Z' },
    { id: EXPENSE_IDS[1], rt_id: E2E_RT_ID, date: '2026-02-15', category: 'Keamanan',     amount: 200000, recipient: 'Vendor E2E 2', description: 'Data uji E2E', active: true, status: 'pending',  created_by: TREASURER_ID, created_at: '2026-02-15T08:00:00Z' },
    { id: EXPENSE_IDS[2], rt_id: E2E_RT_ID, date: '2026-03-15', category: 'Administrasi', amount: 100000, recipient: 'Vendor E2E 3', description: 'Data uji E2E', active: true, status: 'pending',  created_by: TREASURER_ID, created_at: '2026-03-15T08:00:00Z' },
    { id: EXPENSE_IDS[3], rt_id: E2E_RT_ID, date: '2026-04-15', category: 'Kebersihan',   amount: 175000, recipient: 'Vendor E2E 4', description: 'Data uji E2E', active: true, status: 'approved', created_by: TREASURER_ID, approved_at: '2026-04-16T08:00:00Z', created_at: '2026-04-15T08:00:00Z' },
    { id: EXPENSE_IDS[4], rt_id: E2E_RT_ID, date: '2026-05-15', category: 'Keamanan',     amount: 225000, recipient: 'Vendor E2E 5', description: 'Data uji E2E', active: true, status: 'rejected', created_by: TREASURER_ID, rejection_note: 'Data uji E2E', created_at: '2026-05-15T08:00:00Z' },
  ])

  await upsert('income_donations', [
    { id: DONATION_IDS[0], rt_id: E2E_RT_ID, name: 'E2E Donasi Draf',  donation_code: 'E2E-DRAF-001',  description: 'Data uji E2E', target_amount: 1000000, starts_at: '2026-07-01', status: 'DRAFT',  created_by: TREASURER_ID, created_at: '2026-07-01T08:00:00Z', updated_at: '2026-07-01T08:00:00Z' },
    { id: DONATION_IDS[1], rt_id: E2E_RT_ID, name: 'E2E Donasi Aktif', donation_code: 'E2E-AKTIF-001', description: 'Data uji E2E', target_amount: 5000000, starts_at: '2026-07-01', status: 'ACTIVE', created_by: TREASURER_ID, created_at: '2026-07-01T08:00:00Z', updated_at: '2026-07-01T08:00:00Z' },
  ])

  await upsert('income_transactions', [
    { id: INCOME_TX_IDS[0], rt_id: E2E_RT_ID, income_category: 'OTHER',    income_name: 'E2E Pemasukan Lainnya 1', source_type: 'ANONYMOUS', is_anonymous: true,  amount: 500000, received_at: '2026-07-01', status: 'pending', created_by: TREASURER_ID, created_at: '2026-07-01T08:00:00Z', updated_at: '2026-07-01T08:00:00Z' },
    { id: INCOME_TX_IDS[1], rt_id: E2E_RT_ID, income_category: 'DONATION', income_name: 'E2E Donasi Resident 1',  source_type: 'RESIDENT',  is_anonymous: false, amount:  50000, received_at: '2026-07-01', status: 'pending', resident_id: R1, donation_id: DONATION_IDS[1], created_by: CHAIR_ID, created_at: '2026-07-01T09:00:00Z', updated_at: '2026-07-01T09:00:00Z' },
  ])
}
