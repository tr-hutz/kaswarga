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
 *   - 1 RT (RT 05 RW 03, Jakarta Selatan)
 *   - 10 users: CHAIR, TREASURER, ADMIN, 7 RESIDENT
 *   - 10 residents (linked to above users)
 *   - 10 memberships
 *   - 11 payment_confirmations (9 approved, 1 pending, 1 rejected)
 *   - 52 confirmation_details
 *   - 5 expenses, all 5 categories, all pending (approve during PVT)
 *   - 1 income_donation (ACTIVE)
 *   - 3 income_transactions (maker-checker flow + approved example)
 *
 * Cashflow (after seed):
 *   Income  (9 approved payments): Rp 3,750,000
 *   Expenses (all pending):        Rp         0
 *   Saldo Saat Ini:                Rp 3,750,000
 *   Saldo after approving all exp: Rp   350,000  (still positive)
 *
 * Idempotent — cleans up all previous PVT financial data before re-seeding,
 * so stale approved expenses or ledger entries from prior runs are removed.
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

// PVT RT — distinct prefix (a0) from dev (11) so they never collide
const RT_ID = 'a0000000-0000-0000-0000-000000000001'

// User IDs — prefix a00000XX, distinct from dev (ccccccXX)
const U_CHAIR       = 'a0000002-0000-0000-0000-000000000000'
const U_TREASURER   = 'a0000003-0000-0000-0000-000000000000'
const U_ADMIN       = 'a0000004-0000-0000-0000-000000000000'
const U_RESIDENT_1  = 'a0000005-0000-0000-0000-000000000000'
const U_RESIDENT_2  = 'a0000006-0000-0000-0000-000000000000'
const U_RESIDENT_3  = 'a0000007-0000-0000-0000-000000000000'
const U_RESIDENT_4  = 'a0000008-0000-0000-0000-000000000000'
const U_RESIDENT_5  = 'a0000009-0000-0000-0000-000000000000'
const U_RESIDENT_6  = 'a000000a-0000-0000-0000-000000000000'
const U_RESIDENT_7  = 'a000000b-0000-0000-0000-000000000000'

// Resident record IDs (separate from user IDs)
const R_CHAIR       = 'a0000002-0000-0000-0000-000000000001'
const R_TREASURER   = 'a0000003-0000-0000-0000-000000000001'
const R_ADMIN       = 'a0000004-0000-0000-0000-000000000001'
const R_RESIDENT_1  = 'a0000005-0000-0000-0000-000000000001'
const R_RESIDENT_2  = 'a0000006-0000-0000-0000-000000000001'
const R_RESIDENT_3  = 'a0000007-0000-0000-0000-000000000001'
const R_RESIDENT_4  = 'a0000008-0000-0000-0000-000000000001'
const R_RESIDENT_5  = 'a0000009-0000-0000-0000-000000000001'
const R_RESIDENT_6  = 'a000000a-0000-0000-0000-000000000001'
const R_RESIDENT_7  = 'a000000b-0000-0000-0000-000000000001'

const PASSWORD = 'Password123!'

// ---------------------------------------------------------------------------
// Auth users
// ---------------------------------------------------------------------------
const AUTH_USERS = [
  { id: U_CHAIR,      email: 'slamet.riyanto@pvt.com'      },
  { id: U_TREASURER,  email: 'endang.sulistyowati@pvt.com' },
  { id: U_ADMIN,      email: 'widodo.prasetyo@pvt.com'     },
  { id: U_RESIDENT_1, email: 'mulyono.hadi@pvt.com'        },
  { id: U_RESIDENT_2, email: 'sri.wahyuningsih@pvt.com'    },
  { id: U_RESIDENT_3, email: 'agus.triyono@pvt.com'        },
  { id: U_RESIDENT_4, email: 'bambang.setiawan@pvt.com'    },
  { id: U_RESIDENT_5, email: 'nurul.hidayati@pvt.com'      },
  { id: U_RESIDENT_6, email: 'joko.pramono@pvt.com'        },
  { id: U_RESIDENT_7, email: 'rina.susanti@pvt.com'        },
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
  { id: U_CHAIR,      name: 'Slamet Riyanto',       email: 'slamet.riyanto@pvt.com'      },
  { id: U_TREASURER,  name: 'Endang Sulistyowati',  email: 'endang.sulistyowati@pvt.com' },
  { id: U_ADMIN,      name: 'Widodo Prasetyo',      email: 'widodo.prasetyo@pvt.com'     },
  { id: U_RESIDENT_1, name: 'Mulyono Hadi',         email: 'mulyono.hadi@pvt.com'        },
  { id: U_RESIDENT_2, name: 'Sri Wahyuningsih',     email: 'sri.wahyuningsih@pvt.com'    },
  { id: U_RESIDENT_3, name: 'Agus Triyono',         email: 'agus.triyono@pvt.com'        },
  { id: U_RESIDENT_4, name: 'Bambang Setiawan',     email: 'bambang.setiawan@pvt.com'    },
  { id: U_RESIDENT_5, name: 'Nurul Hidayati',       email: 'nurul.hidayati@pvt.com'      },
  { id: U_RESIDENT_6, name: 'Joko Pramono',         email: 'joko.pramono@pvt.com'        },
  { id: U_RESIDENT_7, name: 'Rina Susanti',         email: 'rina.susanti@pvt.com'        },
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
  { id: R_RESIDENT_4, rt_id: RT_ID, name: 'Bambang Setiawan',    block: 'B', house_number: '07', email: 'bambang.setiawan@pvt.com'     },
  { id: R_RESIDENT_5, rt_id: RT_ID, name: 'Nurul Hidayati',      block: 'B', house_number: '08', email: 'nurul.hidayati@pvt.com'       },
  { id: R_RESIDENT_6, rt_id: RT_ID, name: 'Joko Pramono',        block: 'B', house_number: '09', email: 'joko.pramono@pvt.com'         },
  { id: R_RESIDENT_7, rt_id: RT_ID, name: 'Rina Susanti',        block: 'B', house_number: '10', email: 'rina.susanti@pvt.com'         },
]

// ---------------------------------------------------------------------------
// Memberships
// ---------------------------------------------------------------------------
const MEMBERSHIPS = [
  { id: 'a0000002-0000-0000-0000-000000000002', user_id: U_CHAIR,      rt_id: RT_ID, role: 'CHAIR',     resident_id: R_CHAIR      },
  { id: 'a0000003-0000-0000-0000-000000000002', user_id: U_TREASURER,  rt_id: RT_ID, role: 'TREASURER', resident_id: R_TREASURER  },
  { id: 'a0000004-0000-0000-0000-000000000002', user_id: U_ADMIN,      rt_id: RT_ID, role: 'ADMIN',     resident_id: R_ADMIN      },
  { id: 'a0000005-0000-0000-0000-000000000002', user_id: U_RESIDENT_1, rt_id: RT_ID, role: 'RESIDENT',  resident_id: R_RESIDENT_1 },
  { id: 'a0000006-0000-0000-0000-000000000002', user_id: U_RESIDENT_2, rt_id: RT_ID, role: 'RESIDENT',  resident_id: R_RESIDENT_2 },
  { id: 'a0000007-0000-0000-0000-000000000002', user_id: U_RESIDENT_3, rt_id: RT_ID, role: 'RESIDENT',  resident_id: R_RESIDENT_3 },
  { id: 'a0000008-0000-0000-0000-000000000002', user_id: U_RESIDENT_4, rt_id: RT_ID, role: 'RESIDENT',  resident_id: R_RESIDENT_4 },
  { id: 'a0000009-0000-0000-0000-000000000002', user_id: U_RESIDENT_5, rt_id: RT_ID, role: 'RESIDENT',  resident_id: R_RESIDENT_5 },
  { id: 'a000000a-0000-0000-0000-000000000002', user_id: U_RESIDENT_6, rt_id: RT_ID, role: 'RESIDENT',  resident_id: R_RESIDENT_6 },
  { id: 'a000000b-0000-0000-0000-000000000002', user_id: U_RESIDENT_7, rt_id: RT_ID, role: 'RESIDENT',  resident_id: R_RESIDENT_7 },
]

// ---------------------------------------------------------------------------
// Payment confirmations
// Covers: approved history (3 residents paid Jan–Mar), one pending (Apr)
// ---------------------------------------------------------------------------
const PAYMENT_CONFIRMATIONS = [
  // Existing residents — partial payments (approved)
  { id: 'a0000801-0000-0000-0000-000000000000', resident_id: R_RESIDENT_1, rt_id: RT_ID, year: 2026, total_amount: 225000, status: 'approved', created_at: '2026-02-01T08:00:00Z' },
  { id: 'a0000802-0000-0000-0000-000000000000', resident_id: R_RESIDENT_2, rt_id: RT_ID, year: 2026, total_amount: 150000, status: 'approved', created_at: '2026-02-01T08:30:00Z' },
  { id: 'a0000803-0000-0000-0000-000000000000', resident_id: R_RESIDENT_3, rt_id: RT_ID, year: 2026, total_amount:  75000, status: 'approved', created_at: '2026-02-01T09:00:00Z' },
  // CHAIR & TREASURER — 4 months Jan–Apr (approved)
  { id: 'a0000806-0000-0000-0000-000000000000', resident_id: R_CHAIR,      rt_id: RT_ID, year: 2026, total_amount: 300000, status: 'approved', created_at: '2026-02-05T08:00:00Z' },
  { id: 'a0000807-0000-0000-0000-000000000000', resident_id: R_TREASURER,  rt_id: RT_ID, year: 2026, total_amount: 300000, status: 'approved', created_at: '2026-02-05T08:30:00Z' },
  // New residents — full year (approved)
  { id: 'a0000808-0000-0000-0000-000000000000', resident_id: R_RESIDENT_4, rt_id: RT_ID, year: 2026, total_amount: 900000, status: 'approved', created_at: '2026-01-15T08:00:00Z' },
  { id: 'a0000809-0000-0000-0000-000000000000', resident_id: R_RESIDENT_5, rt_id: RT_ID, year: 2026, total_amount: 900000, status: 'approved', created_at: '2026-01-15T08:30:00Z' },
  // New residents — half year (approved)
  { id: 'a000080a-0000-0000-0000-000000000000', resident_id: R_RESIDENT_6, rt_id: RT_ID, year: 2026, total_amount: 450000, status: 'approved', created_at: '2026-01-20T08:00:00Z' },
  { id: 'a000080b-0000-0000-0000-000000000000', resident_id: R_RESIDENT_7, rt_id: RT_ID, year: 2026, total_amount: 450000, status: 'approved', created_at: '2026-01-20T08:30:00Z' },
  // Pending & rejected — for PVT workflow testing
  { id: 'a0000804-0000-0000-0000-000000000000', resident_id: R_RESIDENT_1, rt_id: RT_ID, year: 2026, total_amount:  75000, status: 'pending',                                                                           created_at: '2026-04-28T08:00:00Z' },
  { id: 'a0000805-0000-0000-0000-000000000000', resident_id: R_RESIDENT_2, rt_id: RT_ID, year: 2026, total_amount:  75000, status: 'rejected', rejected_at: '2026-03-05T10:00:00Z', rejection_reason: 'Jumlah tidak sesuai', created_at: '2026-03-04T08:00:00Z' },
]

// ---------------------------------------------------------------------------
// Confirmation details (one row per month per confirmation)
// ---------------------------------------------------------------------------
const CONFIRMATION_DETAILS = [
  // PC1: Mulyono — Jan, Feb, Mar (3 months)
  { id: 'a0000811-0000-0000-0000-000000000000', confirmation_id: 'a0000801-0000-0000-0000-000000000000', resident_id: R_RESIDENT_1, year: 2026, month:  1, amount: 75000, created_at: '2026-02-01T08:00:00Z' },
  { id: 'a0000812-0000-0000-0000-000000000000', confirmation_id: 'a0000801-0000-0000-0000-000000000000', resident_id: R_RESIDENT_1, year: 2026, month:  2, amount: 75000, created_at: '2026-02-01T08:00:00Z' },
  { id: 'a0000813-0000-0000-0000-000000000000', confirmation_id: 'a0000801-0000-0000-0000-000000000000', resident_id: R_RESIDENT_1, year: 2026, month:  3, amount: 75000, created_at: '2026-02-01T08:00:00Z' },
  // PC2: Sri — Jan, Feb (2 months)
  { id: 'a0000821-0000-0000-0000-000000000000', confirmation_id: 'a0000802-0000-0000-0000-000000000000', resident_id: R_RESIDENT_2, year: 2026, month:  1, amount: 75000, created_at: '2026-02-01T08:30:00Z' },
  { id: 'a0000822-0000-0000-0000-000000000000', confirmation_id: 'a0000802-0000-0000-0000-000000000000', resident_id: R_RESIDENT_2, year: 2026, month:  2, amount: 75000, created_at: '2026-02-01T08:30:00Z' },
  // PC3: Agus — Jan (1 month)
  { id: 'a0000831-0000-0000-0000-000000000000', confirmation_id: 'a0000803-0000-0000-0000-000000000000', resident_id: R_RESIDENT_3, year: 2026, month:  1, amount: 75000, created_at: '2026-02-01T09:00:00Z' },
  // PC6: Slamet (CHAIR) — Jan, Feb, Mar, Apr (4 months)
  { id: 'a0000861-0000-0000-0000-000000000000', confirmation_id: 'a0000806-0000-0000-0000-000000000000', resident_id: R_CHAIR,      year: 2026, month:  1, amount: 75000, created_at: '2026-02-05T08:00:00Z' },
  { id: 'a0000862-0000-0000-0000-000000000000', confirmation_id: 'a0000806-0000-0000-0000-000000000000', resident_id: R_CHAIR,      year: 2026, month:  2, amount: 75000, created_at: '2026-02-05T08:00:00Z' },
  { id: 'a0000863-0000-0000-0000-000000000000', confirmation_id: 'a0000806-0000-0000-0000-000000000000', resident_id: R_CHAIR,      year: 2026, month:  3, amount: 75000, created_at: '2026-02-05T08:00:00Z' },
  { id: 'a0000864-0000-0000-0000-000000000000', confirmation_id: 'a0000806-0000-0000-0000-000000000000', resident_id: R_CHAIR,      year: 2026, month:  4, amount: 75000, created_at: '2026-02-05T08:00:00Z' },
  // PC7: Endang (TREASURER) — Jan, Feb, Mar, Apr (4 months)
  { id: 'a0000871-0000-0000-0000-000000000000', confirmation_id: 'a0000807-0000-0000-0000-000000000000', resident_id: R_TREASURER,  year: 2026, month:  1, amount: 75000, created_at: '2026-02-05T08:30:00Z' },
  { id: 'a0000872-0000-0000-0000-000000000000', confirmation_id: 'a0000807-0000-0000-0000-000000000000', resident_id: R_TREASURER,  year: 2026, month:  2, amount: 75000, created_at: '2026-02-05T08:30:00Z' },
  { id: 'a0000873-0000-0000-0000-000000000000', confirmation_id: 'a0000807-0000-0000-0000-000000000000', resident_id: R_TREASURER,  year: 2026, month:  3, amount: 75000, created_at: '2026-02-05T08:30:00Z' },
  { id: 'a0000874-0000-0000-0000-000000000000', confirmation_id: 'a0000807-0000-0000-0000-000000000000', resident_id: R_TREASURER,  year: 2026, month:  4, amount: 75000, created_at: '2026-02-05T08:30:00Z' },
  // PC8: Bambang — full year Jan–Dec (12 months)
  { id: 'a0000881-0000-0000-0000-000000000000', confirmation_id: 'a0000808-0000-0000-0000-000000000000', resident_id: R_RESIDENT_4, year: 2026, month:  1, amount: 75000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'a0000882-0000-0000-0000-000000000000', confirmation_id: 'a0000808-0000-0000-0000-000000000000', resident_id: R_RESIDENT_4, year: 2026, month:  2, amount: 75000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'a0000883-0000-0000-0000-000000000000', confirmation_id: 'a0000808-0000-0000-0000-000000000000', resident_id: R_RESIDENT_4, year: 2026, month:  3, amount: 75000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'a0000884-0000-0000-0000-000000000000', confirmation_id: 'a0000808-0000-0000-0000-000000000000', resident_id: R_RESIDENT_4, year: 2026, month:  4, amount: 75000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'a0000885-0000-0000-0000-000000000000', confirmation_id: 'a0000808-0000-0000-0000-000000000000', resident_id: R_RESIDENT_4, year: 2026, month:  5, amount: 75000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'a0000886-0000-0000-0000-000000000000', confirmation_id: 'a0000808-0000-0000-0000-000000000000', resident_id: R_RESIDENT_4, year: 2026, month:  6, amount: 75000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'a0000887-0000-0000-0000-000000000000', confirmation_id: 'a0000808-0000-0000-0000-000000000000', resident_id: R_RESIDENT_4, year: 2026, month:  7, amount: 75000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'a0000888-0000-0000-0000-000000000000', confirmation_id: 'a0000808-0000-0000-0000-000000000000', resident_id: R_RESIDENT_4, year: 2026, month:  8, amount: 75000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'a0000889-0000-0000-0000-000000000000', confirmation_id: 'a0000808-0000-0000-0000-000000000000', resident_id: R_RESIDENT_4, year: 2026, month:  9, amount: 75000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'a000088a-0000-0000-0000-000000000000', confirmation_id: 'a0000808-0000-0000-0000-000000000000', resident_id: R_RESIDENT_4, year: 2026, month: 10, amount: 75000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'a000088b-0000-0000-0000-000000000000', confirmation_id: 'a0000808-0000-0000-0000-000000000000', resident_id: R_RESIDENT_4, year: 2026, month: 11, amount: 75000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'a000088c-0000-0000-0000-000000000000', confirmation_id: 'a0000808-0000-0000-0000-000000000000', resident_id: R_RESIDENT_4, year: 2026, month: 12, amount: 75000, created_at: '2026-01-15T08:00:00Z' },
  // PC9: Nurul — full year Jan–Dec (12 months)
  { id: 'a0000891-0000-0000-0000-000000000000', confirmation_id: 'a0000809-0000-0000-0000-000000000000', resident_id: R_RESIDENT_5, year: 2026, month:  1, amount: 75000, created_at: '2026-01-15T08:30:00Z' },
  { id: 'a0000892-0000-0000-0000-000000000000', confirmation_id: 'a0000809-0000-0000-0000-000000000000', resident_id: R_RESIDENT_5, year: 2026, month:  2, amount: 75000, created_at: '2026-01-15T08:30:00Z' },
  { id: 'a0000893-0000-0000-0000-000000000000', confirmation_id: 'a0000809-0000-0000-0000-000000000000', resident_id: R_RESIDENT_5, year: 2026, month:  3, amount: 75000, created_at: '2026-01-15T08:30:00Z' },
  { id: 'a0000894-0000-0000-0000-000000000000', confirmation_id: 'a0000809-0000-0000-0000-000000000000', resident_id: R_RESIDENT_5, year: 2026, month:  4, amount: 75000, created_at: '2026-01-15T08:30:00Z' },
  { id: 'a0000895-0000-0000-0000-000000000000', confirmation_id: 'a0000809-0000-0000-0000-000000000000', resident_id: R_RESIDENT_5, year: 2026, month:  5, amount: 75000, created_at: '2026-01-15T08:30:00Z' },
  { id: 'a0000896-0000-0000-0000-000000000000', confirmation_id: 'a0000809-0000-0000-0000-000000000000', resident_id: R_RESIDENT_5, year: 2026, month:  6, amount: 75000, created_at: '2026-01-15T08:30:00Z' },
  { id: 'a0000897-0000-0000-0000-000000000000', confirmation_id: 'a0000809-0000-0000-0000-000000000000', resident_id: R_RESIDENT_5, year: 2026, month:  7, amount: 75000, created_at: '2026-01-15T08:30:00Z' },
  { id: 'a0000898-0000-0000-0000-000000000000', confirmation_id: 'a0000809-0000-0000-0000-000000000000', resident_id: R_RESIDENT_5, year: 2026, month:  8, amount: 75000, created_at: '2026-01-15T08:30:00Z' },
  { id: 'a0000899-0000-0000-0000-000000000000', confirmation_id: 'a0000809-0000-0000-0000-000000000000', resident_id: R_RESIDENT_5, year: 2026, month:  9, amount: 75000, created_at: '2026-01-15T08:30:00Z' },
  { id: 'a000089a-0000-0000-0000-000000000000', confirmation_id: 'a0000809-0000-0000-0000-000000000000', resident_id: R_RESIDENT_5, year: 2026, month: 10, amount: 75000, created_at: '2026-01-15T08:30:00Z' },
  { id: 'a000089b-0000-0000-0000-000000000000', confirmation_id: 'a0000809-0000-0000-0000-000000000000', resident_id: R_RESIDENT_5, year: 2026, month: 11, amount: 75000, created_at: '2026-01-15T08:30:00Z' },
  { id: 'a000089c-0000-0000-0000-000000000000', confirmation_id: 'a0000809-0000-0000-0000-000000000000', resident_id: R_RESIDENT_5, year: 2026, month: 12, amount: 75000, created_at: '2026-01-15T08:30:00Z' },
  // PC10: Joko — half year Jan–Jun (6 months)
  { id: 'a00008a1-0000-0000-0000-000000000000', confirmation_id: 'a000080a-0000-0000-0000-000000000000', resident_id: R_RESIDENT_6, year: 2026, month:  1, amount: 75000, created_at: '2026-01-20T08:00:00Z' },
  { id: 'a00008a2-0000-0000-0000-000000000000', confirmation_id: 'a000080a-0000-0000-0000-000000000000', resident_id: R_RESIDENT_6, year: 2026, month:  2, amount: 75000, created_at: '2026-01-20T08:00:00Z' },
  { id: 'a00008a3-0000-0000-0000-000000000000', confirmation_id: 'a000080a-0000-0000-0000-000000000000', resident_id: R_RESIDENT_6, year: 2026, month:  3, amount: 75000, created_at: '2026-01-20T08:00:00Z' },
  { id: 'a00008a4-0000-0000-0000-000000000000', confirmation_id: 'a000080a-0000-0000-0000-000000000000', resident_id: R_RESIDENT_6, year: 2026, month:  4, amount: 75000, created_at: '2026-01-20T08:00:00Z' },
  { id: 'a00008a5-0000-0000-0000-000000000000', confirmation_id: 'a000080a-0000-0000-0000-000000000000', resident_id: R_RESIDENT_6, year: 2026, month:  5, amount: 75000, created_at: '2026-01-20T08:00:00Z' },
  { id: 'a00008a6-0000-0000-0000-000000000000', confirmation_id: 'a000080a-0000-0000-0000-000000000000', resident_id: R_RESIDENT_6, year: 2026, month:  6, amount: 75000, created_at: '2026-01-20T08:00:00Z' },
  // PC11: Rina — half year Jul–Dec (6 months)
  { id: 'a00008b1-0000-0000-0000-000000000000', confirmation_id: 'a000080b-0000-0000-0000-000000000000', resident_id: R_RESIDENT_7, year: 2026, month:  7, amount: 75000, created_at: '2026-01-20T08:30:00Z' },
  { id: 'a00008b2-0000-0000-0000-000000000000', confirmation_id: 'a000080b-0000-0000-0000-000000000000', resident_id: R_RESIDENT_7, year: 2026, month:  8, amount: 75000, created_at: '2026-01-20T08:30:00Z' },
  { id: 'a00008b3-0000-0000-0000-000000000000', confirmation_id: 'a000080b-0000-0000-0000-000000000000', resident_id: R_RESIDENT_7, year: 2026, month:  9, amount: 75000, created_at: '2026-01-20T08:30:00Z' },
  { id: 'a00008b4-0000-0000-0000-000000000000', confirmation_id: 'a000080b-0000-0000-0000-000000000000', resident_id: R_RESIDENT_7, year: 2026, month: 10, amount: 75000, created_at: '2026-01-20T08:30:00Z' },
  { id: 'a00008b5-0000-0000-0000-000000000000', confirmation_id: 'a000080b-0000-0000-0000-000000000000', resident_id: R_RESIDENT_7, year: 2026, month: 11, amount: 75000, created_at: '2026-01-20T08:30:00Z' },
  { id: 'a00008b6-0000-0000-0000-000000000000', confirmation_id: 'a000080b-0000-0000-0000-000000000000', resident_id: R_RESIDENT_7, year: 2026, month: 12, amount: 75000, created_at: '2026-01-20T08:30:00Z' },
  // PC4: Mulyono — Apr (pending)
  { id: 'a0000841-0000-0000-0000-000000000000', confirmation_id: 'a0000804-0000-0000-0000-000000000000', resident_id: R_RESIDENT_1, year: 2026, month:  4, amount: 75000, created_at: '2026-04-28T08:00:00Z' },
  // PC5: Sri — Mar (rejected)
  { id: 'a0000851-0000-0000-0000-000000000000', confirmation_id: 'a0000805-0000-0000-0000-000000000000', resident_id: R_RESIDENT_2, year: 2026, month:  3, amount: 75000, created_at: '2026-03-04T08:00:00Z' },
]

// ---------------------------------------------------------------------------
// Expenses
// Covers: approved history + pending items for Chair to approve
// ---------------------------------------------------------------------------
const EXPENSES = [
  // 5 expenses covering all categories — all pending so Chair can approve during PVT.
  // Total if all approved: Rp 3,400,000  →  saldo: 3,750,000 − 3,400,000 = Rp 350,000 (positive)
  { id: 'a0000901-0000-0000-0000-000000000000', rt_id: RT_ID, date: '2026-01-10', category: 'Kebersihan',   amount:  350000, recipient: 'Pak Samsul',          description: 'Jasa kebersihan lingkungan RT bulan Januari',      active: true, status: 'pending', created_by: U_TREASURER, created_at: '2026-01-10T08:00:00Z' },
  { id: 'a0000902-0000-0000-0000-000000000000', rt_id: RT_ID, date: '2026-01-10', category: 'Keamanan',     amount:  750000, recipient: 'Pak Haryono',         description: 'Honorarium satpam pos RT bulan Januari',           active: true, status: 'pending', created_by: U_TREASURER, created_at: '2026-01-10T08:15:00Z' },
  { id: 'a0000903-0000-0000-0000-000000000000', rt_id: RT_ID, date: '2026-03-05', category: 'Sosial',       amount:  600000, recipient: 'Keluarga Pak Riyono', description: 'Santunan warga sakit — Pak Riyono blok B no. 08', active: true, status: 'pending', created_by: U_TREASURER, created_at: '2026-03-05T09:00:00Z' },
  { id: 'a0000904-0000-0000-0000-000000000000', rt_id: RT_ID, date: '2026-04-20', category: 'Pemeliharaan', amount: 1250000, recipient: 'Toko Listrik Maju',   description: 'Perbaikan lampu jalan gang B nomor 3 dan 5',       active: true, status: 'pending', created_by: U_TREASURER, created_at: '2026-04-20T08:00:00Z' },
  { id: 'a0000905-0000-0000-0000-000000000000', rt_id: RT_ID, date: '2026-04-25', category: 'Administrasi', amount:  450000, recipient: 'Warung Bu Dewi',      description: 'Konsumsi rapat warga RT tanggal 25 April 2026',    active: true, status: 'pending', created_by: U_TREASURER, created_at: '2026-04-25T08:00:00Z' },
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

console.log('\nStep 3: Cleaning up previous PVT financial data...')
// Delete in child → parent order so FK constraints are never violated.
// payment_details has no rt_id — fetch parent payment IDs first.
const { data: pvtPaymentRows, error: pvtPayErr } = await supabase
  .from('payments').select('id').eq('rt_id', RT_ID)
if (pvtPayErr) throw new Error(`[cleanup payments lookup] ${pvtPayErr.message}`)
if (pvtPaymentRows?.length) {
  const ids = pvtPaymentRows.map(p => p.id)
  const { error } = await supabase.from('payment_details').delete().in('payment_id', ids)
  if (error) throw new Error(`[cleanup payment_details] ${error.message}`)
}

const CLEANUP_STEPS = [
  // table                   col                value
  ['ledger',                'rt_id',            RT_ID],
  ['payments',              'rt_id',            RT_ID],
  ['confirmation_details',  'confirmation_id',  PAYMENT_CONFIRMATIONS.map(r => r.id)],
  ['payment_confirmations', 'rt_id',            RT_ID],
  ['income_transactions',   'rt_id',            RT_ID],
  ['income_donations',      'rt_id',            RT_ID],
  ['expenses',              'rt_id',            RT_ID],
]

for (const [table, col, val] of CLEANUP_STEPS) {
  const q = Array.isArray(val)
    ? supabase.from(table).delete().in(col, val)
    : supabase.from(table).delete().eq(col, val)
  const { error } = await q
  if (error) throw new Error(`[cleanup ${table}] ${error.message}`)
}
console.log('  ✓  previous PVT financial data cleared\n')

console.log('Step 4: Inserting financial data...')

// Directly upserting status='approved' bypasses approve_confirmation(), which
// means payments, payment_details, and ledger rows are never created.
// Instead: insert approved ones as 'pending', upsert details, then call the
// stored procedure so the full flow (payments + ledger) runs correctly.
const toApprove  = PAYMENT_CONFIRMATIONS.filter(r => r.status === 'approved')
const notApprove = PAYMENT_CONFIRMATIONS.filter(r => r.status !== 'approved')
const pendingForApproval = toApprove.map(({ approved_at, ...rest }) => ({ ...rest, status: 'pending' }))
await upsert('payment_confirmations', [...pendingForApproval, ...notApprove])
console.log(`  ✓  payment_confirmations: ${PAYMENT_CONFIRMATIONS.length} rows`)

await upsert('confirmation_details', CONFIRMATION_DETAILS)
console.log(`  ✓  confirmation_details:  ${CONFIRMATION_DETAILS.length} rows`)

let approved = 0, alreadyApproved = 0
for (const pc of toApprove) {
  const { data } = await supabase.from('payment_confirmations').select('status').eq('id', pc.id).single()
  if (data?.status === 'approved') { alreadyApproved++; continue }
  const { error } = await supabase.rpc('approve_confirmation', {
    p_confirmation_id: pc.id,
    p_user_id:         U_TREASURER,
  })
  if (error) throw new Error(`[approve_confirmation ${pc.id}] ${error.message}`)
  approved++
}
console.log(`  ✓  approved via RPC:      ${approved} approved, ${alreadyApproved} already existed`)

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
console.log('  CHAIR       : slamet.riyanto@pvt.com')
console.log('  TREASURER   : endang.sulistyowati@pvt.com')
console.log('  ADMIN       : widodo.prasetyo@pvt.com')
console.log('  RESIDENT    : mulyono.hadi@pvt.com')
console.log('  RESIDENT    : sri.wahyuningsih@pvt.com')
console.log('  RESIDENT    : agus.triyono@pvt.com')
console.log('  RESIDENT    : bambang.setiawan@pvt.com')
console.log('  RESIDENT    : nurul.hidayati@pvt.com')
console.log('  RESIDENT    : joko.pramono@pvt.com')
console.log('  RESIDENT    : rina.susanti@pvt.com')
console.log()
console.log('Ready for PVT:')
console.log('  Payment confirmations : 9 approved (history) + 1 pending + 1 rejected')
console.log('  Saldo Saat Ini        : Rp 3.750.000 (income from 9 approved payments)')
console.log('  Expenses              : 5 pending Chair approval (all categories covered)')
console.log('  Saldo after all exp   : Rp 350.000 (still positive)')
console.log('  Active donation       : Donasi Renovasi Pos RT (target Rp 5.000.000)')
console.log('  Income transactions   : 1 pending TREASURER approval + 1 pending CHAIR approval + 1 approved\n')
