/**
 * seed-pvt.mjs
 *
 * Seeds representative PVT (Production Verification Test) data into the
 * production Supabase project. Emails use @pvt.com — realistic in
 * structure, but not real accounts.
 *
 * Run after migrations are applied on the production Supabase project:
 *
 *   npm run seed:pvt
 *
 * What it creates:
 *   - 1 SUPER_ADMIN (System RT)
 *   - 1 RT (RT 05 RW 03, Jakarta Selatan)
 *   - 6 users: CHAIR, TREASURER, RT_ADMIN, 3 RESIDENT
 *   - 6 residents (linked to above users)
 *   - 7 memberships (including SUPER_ADMIN in System RT)
 *   - 5 payment_confirmations (3 approved, 1 pending, 1 rejected)
 *   - 8 confirmation_details
 *   - 9 expenses (5 approved, 4 pending Chair approval)
 *   - 1 income_donation (ACTIVE)
 *   - 3 income_transactions (maker-checker flow + approved example)
 *
 * All inserts are idempotent — safe to re-run if something failed midway.
 */

import { createClient } from '@supabase/supabase-js'
import { loadEnv } from './load-env.mjs'

loadEnv('.env.production')

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:')
  if (!SUPABASE_URL)     console.error('  NEXT_PUBLIC_SUPABASE_URL')
  if (!SERVICE_ROLE_KEY) console.error('  SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nAdd these to .env.production or .env.production.local and try again.')
  process.exit(1)
}

const ADMIN_HEADERS = {
  apikey:         SERVICE_ROLE_KEY,
  Authorization:  `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// System RT — hardcoded in migration 009_seed.sql, must never change.
const SYSTEM_RT_ID = '00000000-0000-0000-0000-000000000001'

// PVT RT — distinct prefix (a0) from dev (11) so they never collide
const RT_ID = 'a0000000-0000-0000-0000-000000000001'

// User IDs — prefix a00000XX, distinct from dev (ccccccXX)
const U_SUPERADMIN  = 'a0000001-0000-0000-0000-000000000000'
const U_CHAIR       = 'a0000002-0000-0000-0000-000000000000'
const U_TREASURER   = 'a0000003-0000-0000-0000-000000000000'
const U_ADMIN       = 'a0000004-0000-0000-0000-000000000000'
const U_RESIDENT_1  = 'a0000005-0000-0000-0000-000000000000'
const U_RESIDENT_2  = 'a0000006-0000-0000-0000-000000000000'
const U_RESIDENT_3  = 'a0000007-0000-0000-0000-000000000000'

// Resident record IDs (separate from user IDs)
const R_CHAIR       = 'a0000002-0000-0000-0000-000000000001'
const R_TREASURER   = 'a0000003-0000-0000-0000-000000000001'
const R_ADMIN       = 'a0000004-0000-0000-0000-000000000001'
const R_RESIDENT_1  = 'a0000005-0000-0000-0000-000000000001'
const R_RESIDENT_2  = 'a0000006-0000-0000-0000-000000000001'
const R_RESIDENT_3  = 'a0000007-0000-0000-0000-000000000001'

const PASSWORD = 'Password123!'

// ---------------------------------------------------------------------------
// Auth users
// ---------------------------------------------------------------------------
const AUTH_USERS = [
  { id: U_SUPERADMIN, email: 'superadmin@pvt.com'          },
  { id: U_CHAIR,      email: 'slamet.riyanto@pvt.com'      },
  { id: U_TREASURER,  email: 'endang.sulistyowati@pvt.com' },
  { id: U_ADMIN,      email: 'widodo.prasetyo@pvt.com'     },
  { id: U_RESIDENT_1, email: 'mulyono.hadi@pvt.com'        },
  { id: U_RESIDENT_2, email: 'sri.wahyuningsih@pvt.com'    },
  { id: U_RESIDENT_3, email: 'agus.triyono@pvt.com'        },
]

// ---------------------------------------------------------------------------
// RT
// ---------------------------------------------------------------------------
const RT = {
  id:             RT_ID,
  name:           'RT 05 RW 03',
  code:           'RT05RW03',
  address:        'Jl. Veteran No. 12',
  city:           'Jakarta Selatan',
  province:       'DKI Jakarta',
  postal_code:    '12210',
  email:          'rt05rw03@pvt.com',
  phone:          '081234567890',
  monthly_fee:    75000,
  bank_name:      'BCA',
  account_number: '1234000001',
  account_holder: 'RT 05 RW 03',
}

// ---------------------------------------------------------------------------
// Public users
// ---------------------------------------------------------------------------
const PUBLIC_USERS = [
  { id: U_SUPERADMIN, name: 'Super Admin',          email: 'superadmin@pvt.com'          },
  { id: U_CHAIR,      name: 'Slamet Riyanto',       email: 'slamet.riyanto@pvt.com'      },
  { id: U_TREASURER,  name: 'Endang Sulistyowati',  email: 'endang.sulistyowati@pvt.com' },
  { id: U_ADMIN,      name: 'Widodo Prasetyo',      email: 'widodo.prasetyo@pvt.com'     },
  { id: U_RESIDENT_1, name: 'Mulyono Hadi',         email: 'mulyono.hadi@pvt.com'        },
  { id: U_RESIDENT_2, name: 'Sri Wahyuningsih',     email: 'sri.wahyuningsih@pvt.com'    },
  { id: U_RESIDENT_3, name: 'Agus Triyono',         email: 'agus.triyono@pvt.com'        },
]

// ---------------------------------------------------------------------------
// Residents
// ---------------------------------------------------------------------------
const RESIDENTS = [
  { id: R_CHAIR,      rt_id: RT_ID, name: 'Slamet Riyanto',      block: 'B', house_number: '01', email: 'slamet.riyanto@pvt.com'      },
  { id: R_TREASURER,  rt_id: RT_ID, name: 'Endang Sulistyowati', block: 'B', house_number: '02', email: 'endang.sulistyowati@pvt.com'  },
  { id: R_ADMIN,      rt_id: RT_ID, name: 'Widodo Prasetyo',     block: 'B', house_number: '03', email: 'widodo.prasetyo@pvt.com'      },
  { id: R_RESIDENT_1, rt_id: RT_ID, name: 'Mulyono Hadi',        block: 'B', house_number: '04', email: 'mulyono.hadi@pvt.com'         },
  { id: R_RESIDENT_2, rt_id: RT_ID, name: 'Sri Wahyuningsih',    block: 'B', house_number: '05', email: 'sri.wahyuningsih@pvt.com'     },
  { id: R_RESIDENT_3, rt_id: RT_ID, name: 'Agus Triyono',        block: 'B', house_number: '06', email: 'agus.triyono@pvt.com'         },
]

// ---------------------------------------------------------------------------
// Memberships
// ---------------------------------------------------------------------------
const MEMBERSHIPS = [
  { id: 'a0000001-0000-0000-0000-000000000002', user_id: U_SUPERADMIN, rt_id: SYSTEM_RT_ID, role: 'SUPER_ADMIN'                              },
  { id: 'a0000002-0000-0000-0000-000000000002', user_id: U_CHAIR,      rt_id: RT_ID,        role: 'CHAIR',     resident_id: R_CHAIR      },
  { id: 'a0000003-0000-0000-0000-000000000002', user_id: U_TREASURER,  rt_id: RT_ID,        role: 'TREASURER', resident_id: R_TREASURER  },
  { id: 'a0000004-0000-0000-0000-000000000002', user_id: U_ADMIN,      rt_id: RT_ID,        role: 'RT_ADMIN',  resident_id: R_ADMIN      },
  { id: 'a0000005-0000-0000-0000-000000000002', user_id: U_RESIDENT_1, rt_id: RT_ID,        role: 'RESIDENT',  resident_id: R_RESIDENT_1 },
  { id: 'a0000006-0000-0000-0000-000000000002', user_id: U_RESIDENT_2, rt_id: RT_ID,        role: 'RESIDENT',  resident_id: R_RESIDENT_2 },
  { id: 'a0000007-0000-0000-0000-000000000002', user_id: U_RESIDENT_3, rt_id: RT_ID,        role: 'RESIDENT',  resident_id: R_RESIDENT_3 },
]

// ---------------------------------------------------------------------------
// Payment confirmations
// Covers: approved history (3 residents paid Jan–Mar), one pending (Apr)
// ---------------------------------------------------------------------------
const PAYMENT_CONFIRMATIONS = [
  { id: 'a0000801-0000-0000-0000-000000000000', resident_id: R_RESIDENT_1, rt_id: RT_ID, year: 2026, total_amount: 225000, status: 'approved', approved_at: '2026-02-03T09:00:00Z', created_at: '2026-02-01T08:00:00Z' },
  { id: 'a0000802-0000-0000-0000-000000000000', resident_id: R_RESIDENT_2, rt_id: RT_ID, year: 2026, total_amount: 150000, status: 'approved', approved_at: '2026-02-03T09:30:00Z', created_at: '2026-02-01T08:30:00Z' },
  { id: 'a0000803-0000-0000-0000-000000000000', resident_id: R_RESIDENT_3, rt_id: RT_ID, year: 2026, total_amount:  75000, status: 'approved', approved_at: '2026-02-03T10:00:00Z', created_at: '2026-02-01T09:00:00Z' },
  { id: 'a0000804-0000-0000-0000-000000000000', resident_id: R_RESIDENT_1, rt_id: RT_ID, year: 2026, total_amount:  75000, status: 'pending',                                         created_at: '2026-04-28T08:00:00Z' },
  { id: 'a0000805-0000-0000-0000-000000000000', resident_id: R_RESIDENT_2, rt_id: RT_ID, year: 2026, total_amount:  75000, status: 'rejected', rejected_at: '2026-03-05T10:00:00Z', rejection_reason: 'Jumlah tidak sesuai', created_at: '2026-03-04T08:00:00Z' },
]

// ---------------------------------------------------------------------------
// Confirmation details (one row per month per confirmation)
// ---------------------------------------------------------------------------
const CONFIRMATION_DETAILS = [
  // PC1: Mulyono — Jan, Feb, Mar
  { id: 'a0000811-0000-0000-0000-000000000000', confirmation_id: 'a0000801-0000-0000-0000-000000000000', resident_id: R_RESIDENT_1, year: 2026, month: 1, amount: 75000, created_at: '2026-02-01T08:00:00Z' },
  { id: 'a0000812-0000-0000-0000-000000000000', confirmation_id: 'a0000801-0000-0000-0000-000000000000', resident_id: R_RESIDENT_1, year: 2026, month: 2, amount: 75000, created_at: '2026-02-01T08:00:00Z' },
  { id: 'a0000813-0000-0000-0000-000000000000', confirmation_id: 'a0000801-0000-0000-0000-000000000000', resident_id: R_RESIDENT_1, year: 2026, month: 3, amount: 75000, created_at: '2026-02-01T08:00:00Z' },
  // PC2: Sri — Jan, Feb
  { id: 'a0000821-0000-0000-0000-000000000000', confirmation_id: 'a0000802-0000-0000-0000-000000000000', resident_id: R_RESIDENT_2, year: 2026, month: 1, amount: 75000, created_at: '2026-02-01T08:30:00Z' },
  { id: 'a0000822-0000-0000-0000-000000000000', confirmation_id: 'a0000802-0000-0000-0000-000000000000', resident_id: R_RESIDENT_2, year: 2026, month: 2, amount: 75000, created_at: '2026-02-01T08:30:00Z' },
  // PC3: Agus — Jan
  { id: 'a0000831-0000-0000-0000-000000000000', confirmation_id: 'a0000803-0000-0000-0000-000000000000', resident_id: R_RESIDENT_3, year: 2026, month: 1, amount: 75000, created_at: '2026-02-01T09:00:00Z' },
  // PC4: Mulyono — Apr (pending)
  { id: 'a0000841-0000-0000-0000-000000000000', confirmation_id: 'a0000804-0000-0000-0000-000000000000', resident_id: R_RESIDENT_1, year: 2026, month: 4, amount: 75000, created_at: '2026-04-28T08:00:00Z' },
  // PC5: Sri — Mar (rejected)
  { id: 'a0000851-0000-0000-0000-000000000000', confirmation_id: 'a0000805-0000-0000-0000-000000000000', resident_id: R_RESIDENT_2, year: 2026, month: 3, amount: 75000, created_at: '2026-03-04T08:00:00Z' },
]

// ---------------------------------------------------------------------------
// Expenses
// Covers: approved history + pending items for Chair to approve
// ---------------------------------------------------------------------------
const EXPENSES = [
  { id: 'a0000901-0000-0000-0000-000000000000', rt_id: RT_ID, date: '2026-01-10', category: 'Kebersihan',   amount:  350000, recipient: 'Pak Samsul',         description: 'Jasa kebersihan lingkungan RT bulan Januari',      active: true, status: 'approved', created_by: U_TREASURER, approved_at: '2026-01-12T09:00:00Z', created_at: '2026-01-10T08:00:00Z' },
  { id: 'a0000902-0000-0000-0000-000000000000', rt_id: RT_ID, date: '2026-01-10', category: 'Keamanan',     amount:  750000, recipient: 'Pak Haryono',        description: 'Honorarium satpam pos RT bulan Januari',           active: true, status: 'approved', created_by: U_TREASURER, approved_at: '2026-01-12T09:15:00Z', created_at: '2026-01-10T08:15:00Z' },
  { id: 'a0000903-0000-0000-0000-000000000000', rt_id: RT_ID, date: '2026-02-10', category: 'Kebersihan',   amount:  350000, recipient: 'Pak Samsul',         description: 'Jasa kebersihan lingkungan RT bulan Februari',     active: true, status: 'approved', created_by: U_TREASURER, approved_at: '2026-02-12T09:00:00Z', created_at: '2026-02-10T08:00:00Z' },
  { id: 'a0000904-0000-0000-0000-000000000000', rt_id: RT_ID, date: '2026-02-10', category: 'Keamanan',     amount:  750000, recipient: 'Pak Haryono',        description: 'Honorarium satpam pos RT bulan Februari',          active: true, status: 'approved', created_by: U_TREASURER, approved_at: '2026-02-12T09:15:00Z', created_at: '2026-02-10T08:15:00Z' },
  { id: 'a0000905-0000-0000-0000-000000000000', rt_id: RT_ID, date: '2026-03-05', category: 'Sosial',       amount:  600000, recipient: 'Keluarga Pak Riyono', description: 'Santunan warga sakit — Pak Riyono blok B no. 08', active: true, status: 'approved', created_by: U_TREASURER, approved_at: '2026-03-06T10:00:00Z', created_at: '2026-03-05T09:00:00Z' },
  { id: 'a0000906-0000-0000-0000-000000000000', rt_id: RT_ID, date: '2026-04-20', category: 'Pemeliharaan', amount: 1250000, recipient: 'Toko Listrik Maju',  description: 'Perbaikan lampu jalan gang B nomor 3 dan 5',       active: true, status: 'pending',  created_by: U_TREASURER,                                           created_at: '2026-04-20T08:00:00Z' },
  { id: 'a0000907-0000-0000-0000-000000000000', rt_id: RT_ID, date: '2026-04-22', category: 'Kebersihan',   amount:  350000, recipient: 'Pak Samsul',         description: 'Jasa kebersihan lingkungan RT bulan April',        active: true, status: 'pending',  created_by: U_TREASURER,                                           created_at: '2026-04-22T08:00:00Z' },
  { id: 'a0000908-0000-0000-0000-000000000000', rt_id: RT_ID, date: '2026-04-22', category: 'Keamanan',     amount:  750000, recipient: 'Pak Haryono',        description: 'Honorarium satpam pos RT bulan April',             active: true, status: 'pending',  created_by: U_TREASURER,                                           created_at: '2026-04-22T08:30:00Z' },
  { id: 'a0000909-0000-0000-0000-000000000000', rt_id: RT_ID, date: '2026-04-25', category: 'Administrasi', amount:  450000, recipient: 'Warung Bu Dewi',     description: 'Konsumsi rapat warga RT tanggal 25 April 2026',    active: true, status: 'pending',  created_by: U_TREASURER,                                           created_at: '2026-04-25T08:00:00Z' },
]

// ---------------------------------------------------------------------------
// Income donation
// ---------------------------------------------------------------------------
const INCOME_DONATIONS = [
  {
    id:            'a0000a01-0000-0000-0000-000000000000',
    rt_id:         RT_ID,
    name:          'Donasi Renovasi Pos RT',
    donation_code: 'DNT-2026-001',
    description:   'Penggalangan dana untuk renovasi pos ronda dan area tunggu RT 05 RW 03.',
    target_amount: 5000000,
    starts_at:     '2026-04-01',
    status:        'ACTIVE',
    created_by:    U_TREASURER,
    created_at:    '2026-03-28T08:00:00Z',
    updated_at:    '2026-04-01T08:00:00Z',
  },
]

// ---------------------------------------------------------------------------
// Income transactions
// TX1: DONATION submitted by CHAIR — pending, so TREASURER can approve (maker-checker)
// TX2: OTHER submitted by TREASURER — pending, so CHAIR can approve (maker-checker)
// TX3: OTHER submitted by TREASURER — already approved (completed example)
// ---------------------------------------------------------------------------
const INCOME_TRANSACTIONS = [
  {
    id:              'a0000b01-0000-0000-0000-000000000000',
    rt_id:           RT_ID,
    income_category: 'DONATION',
    income_name:     'Donasi dari Mulyono Hadi',
    source_type:     'RESIDENT',
    resident_id:     R_RESIDENT_1,
    is_anonymous:    false,
    amount:          500000,
    received_at:     '2026-04-15',
    status:          'pending',
    donation_id:     'a0000a01-0000-0000-0000-000000000000',
    created_by:      U_CHAIR,
    created_at:      '2026-04-15T10:00:00Z',
    updated_at:      '2026-04-15T10:00:00Z',
  },
  {
    id:              'a0000b02-0000-0000-0000-000000000000',
    rt_id:           RT_ID,
    income_category: 'OTHER',
    income_name:     'Sewa lapangan bulu tangkis',
    source_type:     'ANONYMOUS',
    is_anonymous:    true,
    amount:          250000,
    received_at:     '2026-04-20',
    status:          'pending',
    created_by:      U_TREASURER,
    created_at:      '2026-04-20T11:00:00Z',
    updated_at:      '2026-04-20T11:00:00Z',
  },
  {
    id:              'a0000b03-0000-0000-0000-000000000000',
    rt_id:           RT_ID,
    income_category: 'OTHER',
    income_name:     'Iuran kebersihan tambahan',
    source_type:     'ANONYMOUS',
    is_anonymous:    true,
    amount:          150000,
    received_at:     '2026-03-01',
    status:          'approved',
    created_by:      U_TREASURER,
    created_at:      '2026-03-01T09:00:00Z',
    updated_at:      '2026-03-01T09:00:00Z',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function createAuthUser(user) {
  const res  = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method:  'POST',
    headers: ADMIN_HEADERS,
    body:    JSON.stringify({ id: user.id, email: user.email, password: PASSWORD, email_confirm: true }),
  })
  const body = await res.json()
  if (res.ok) return 'created'
  if (body.code === 'email_exists' || body.msg?.includes('already been registered')) return 'exists'
  throw new Error(body.msg ?? body.message ?? JSON.stringify(body))
}

async function upsert(table, rows) {
  const payload = Array.isArray(rows) ? rows : [rows]
  const { error } = await supabase.from(table).upsert(payload, { onConflict: 'id', ignoreDuplicates: true })
  if (error) throw new Error(`[${table}] ${error.message}`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log(`Supabase: ${SUPABASE_URL}`)
console.log('=== PVT seed ===\n')

console.log('Step 1: Creating auth users...')
let created = 0, skipped = 0
for (const user of AUTH_USERS) {
  try {
    const result = await createAuthUser(user)
    if (result === 'created') { console.log(`  ✓  ${user.email}`); created++ }
    else                      { console.log(`  -  ${user.email} (already exists)`); skipped++ }
  } catch (err) {
    console.error(`  ✗  ${user.email}: ${err.message}`)
    process.exit(1)
  }
}
console.log(`  → ${created} created, ${skipped} already existed\n`)

console.log('Step 2: Inserting RT, users, residents, memberships...')
await upsert('rt', RT)
console.log(`  ✓  rt: ${RT.name}`)

await upsert('users', PUBLIC_USERS)
console.log(`  ✓  users: ${PUBLIC_USERS.length} rows`)

await upsert('residents', RESIDENTS)
console.log(`  ✓  residents: ${RESIDENTS.length} rows`)

await upsert('memberships', MEMBERSHIPS)
console.log(`  ✓  memberships: ${MEMBERSHIPS.length} rows`)

console.log('\nStep 3: Inserting financial data...')
await upsert('payment_confirmations', PAYMENT_CONFIRMATIONS)
const pendingConf = PAYMENT_CONFIRMATIONS.filter(r => r.status === 'pending').length
console.log(`  ✓  payment_confirmations: ${PAYMENT_CONFIRMATIONS.length} rows  (${pendingConf} pending)`)

await upsert('confirmation_details', CONFIRMATION_DETAILS)
console.log(`  ✓  confirmation_details:  ${CONFIRMATION_DETAILS.length} rows`)

await upsert('expenses', EXPENSES)
const pendingExp = EXPENSES.filter(e => e.status === 'pending').length
console.log(`  ✓  expenses:              ${EXPENSES.length} rows  (${pendingExp} pending approval)`)

await upsert('income_donations', INCOME_DONATIONS)
console.log(`  ✓  income_donations:      ${INCOME_DONATIONS.length} rows  (ACTIVE)`)

await upsert('income_transactions', INCOME_TRANSACTIONS)
const pendingTx = INCOME_TRANSACTIONS.filter(t => t.status === 'pending').length
console.log(`  ✓  income_transactions:   ${INCOME_TRANSACTIONS.length} rows  (${pendingTx} pending approval)`)

console.log('\n=== PVT seed complete ===\n')
console.log('Accounts (all passwords: Password123!):')
console.log('  SUPER_ADMIN : superadmin@pvt.com')
console.log('  CHAIR       : slamet.riyanto@pvt.com')
console.log('  TREASURER   : endang.sulistyowati@pvt.com')
console.log('  RT_ADMIN    : widodo.prasetyo@pvt.com')
console.log('  RESIDENT    : mulyono.hadi@pvt.com')
console.log('  RESIDENT    : sri.wahyuningsih@pvt.com')
console.log('  RESIDENT    : agus.triyono@pvt.com')
console.log()
console.log('Ready for PVT:')
console.log('  Payment confirmations : 3 approved (history) + 1 pending + 1 rejected')
console.log('  Expenses              : 5 approved (history) + 4 pending Chair approval')
console.log('  Active donation       : Donasi Renovasi Pos RT (target Rp 5.000.000)')
console.log('  Income transactions   : 1 pending TREASURER approval + 1 pending CHAIR approval + 1 approved\n')
