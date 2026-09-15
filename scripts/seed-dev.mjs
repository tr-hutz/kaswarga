/**
 * seed-dev.mjs
 *
 * Full dev seed: SUPER_ADMIN + 13 sample users (auth + public data).
 * Run after `supabase db reset`:
 *
 *   npm run seed:dev
 *
 * What it creates:
 *   - 10 RTs, 19 public.users, 24 residents, 19 memberships
 *   - RT 01 financial data: 8 payment confirmations, 49 details,
 *     4 expenses (2 approved), 2 income_transactions (1 pending)
 *
 * Cashflow for RT 01 (monthly fee: Rp 50,000):
 *   Approved iuran (6 confirmed):  Rp 2,350,000
 *   Approved expenses (2):         Rp   650,000
 *   Saldo Saat Ini:                Rp 1,700,000
 *   Saldo after pending expenses:  Rp 1,350,000  (still positive)
 *
 * Idempotent — cleans up all previous RT 01 financial data before re-seeding.
 */

import { createClient } from '@supabase/supabase-js'
import { loadEnv } from './load-env.mjs'

loadEnv('.env.local')

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:')
  if (!SUPABASE_URL)     console.error('  NEXT_PUBLIC_SUPABASE_URL')
  if (!SERVICE_ROLE_KEY) console.error('  SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nAdd these to .env.local and try again.')
  process.exit(1)
}

const ADMIN_HEADERS = {
  apikey:         SERVICE_ROLE_KEY,
  Authorization:  `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ---------------------------------------------------------------------------
// RT 01 constants (used in financial data)
// ---------------------------------------------------------------------------
const RT1_ID = '11111111-1111-1111-1111-111111111111'

// User IDs for RT 01
const U_CHAIR     = 'cccccccc-cccc-cccc-cccc-cccccccccc11'  // Hendra Wijaya
const U_TREASURER = 'cccccccc-cccc-cccc-cccc-cccccccccc12'  // Dewi Rahayu

// Resident IDs for RT 01
const R_CHAIR     = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb11'  // Hendra Wijaya
const R_TREASURER = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb12'  // Dewi Rahayu
const R_ADMIN     = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'  // Budi Santoso
const R_SITI      = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2'  // Siti Aminah
const R_AGUS      = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb13'  // Agus Setiawan
const R_FITRI     = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb14'  // Fitri Handayani
const R_BAMBANG   = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb15'  // Bambang Supriyanto
const R_SRI       = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb16'  // Sri Wahyuni

// ---------------------------------------------------------------------------
// Auth users
// ---------------------------------------------------------------------------
const SUPER_ADMIN_AUTH = {
  id:       'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  email:    'superadmin@dev.com',
  password: 'Password123!',
}

const SAMPLE_PASSWORD = 'Password123!'

const SAMPLE_AUTH_USERS = [
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc1', email: 'admin@dev.com'      },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc2', email: 'warga@dev.com'      },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc3', email: 'andi@dev.com'       },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc4', email: 'rina@dev.com'       },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc5', email: 'dedi@dev.com'       },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc6', email: 'maya@dev.com'       },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc7', email: 'fajar@dev.com'      },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc8', email: 'lina@dev.com'       },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc9', email: 'rudi@dev.com'       },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc10', email: 'nina@dev.com'       },
  { id: U_CHAIR,                                email: 'ketua@dev.com'      },
  { id: U_TREASURER,                            email: 'bendahara@dev.com'  },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc13', email: 'teguh@dev.com'      },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc14', email: 'agus@dev.com'       },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc15', email: 'fitri@dev.com'      },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc16', email: 'bambang@dev.com'    },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc17', email: 'sri@dev.com'        },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc18', email: 'wahyu@dev.com'      },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc19', email: 'eka@dev.com'        },
]

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------
const RTS = [
  {
    id: RT1_ID,
    name: 'RT 01 RW 05', code: 'RT01',
    address: 'Ruko Melati Blok A', city: 'Bandung', province: 'Jawa Barat', postal_code: '40123',
    email: 'rt01@dev.com', phone: '081200000001',
    monthly_fee: 50000,
    bank_name: 'BCA', account_number: '1234567890', account_holder: 'RT 01 RW 05',
    qris_url: 'https://example.com/qris1.png', logo_url: 'https://example.com/logo1.png',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'RT 02 RW 05', code: 'RT02',
    address: 'Ruko Melati Blok B', city: 'Bandung', province: 'Jawa Barat', postal_code: '40123',
    email: 'rt02@dev.com', phone: '081200000002',
    monthly_fee: 60000,
    bank_name: 'BRI', account_number: '1234567891', account_holder: 'RT 02 RW 05',
    qris_url: 'https://example.com/qris2.png', logo_url: 'https://example.com/logo2.png',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'RT 03 RW 05', code: 'RT03',
    address: 'Ruko Melati Blok C', city: 'Bandung', province: 'Jawa Barat', postal_code: '40123',
    email: 'rt03@dev.com', phone: '081200000003',
    monthly_fee: 55000,
    bank_name: 'BNI', account_number: '1234567892', account_holder: 'RT 03 RW 05',
    qris_url: 'https://example.com/qris3.png', logo_url: 'https://example.com/logo3.png',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'RT 04 RW 05', code: 'RT04',
    address: 'Ruko Melati Blok D', city: 'Bandung', province: 'Jawa Barat', postal_code: '40123',
    email: 'rt04@dev.com', phone: '081200000004',
    monthly_fee: 50000,
    bank_name: 'Mandiri', account_number: '1234567893', account_holder: 'RT 04 RW 05',
    qris_url: 'https://example.com/qris4.png', logo_url: 'https://example.com/logo4.png',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'RT 05 RW 05', code: 'RT05',
    address: 'Ruko Melati Blok E', city: 'Bandung', province: 'Jawa Barat', postal_code: '40123',
    email: 'rt05@dev.com', phone: '081200000005',
    monthly_fee: 65000,
    bank_name: 'BCA', account_number: '1234567894', account_holder: 'RT 05 RW 05',
    qris_url: 'https://example.com/qris5.png', logo_url: 'https://example.com/logo5.png',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'RT 06 RW 05', code: 'RT06',
    address: 'Ruko Melati Blok F', city: 'Bandung', province: 'Jawa Barat', postal_code: '40123',
    email: 'rt06@dev.com', phone: '081200000006',
    monthly_fee: 50000,
    bank_name: 'BRI', account_number: '1234567895', account_holder: 'RT 06 RW 05',
    qris_url: 'https://example.com/qris6.png', logo_url: 'https://example.com/logo6.png',
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    name: 'RT 07 RW 05', code: 'RT07',
    address: 'Ruko Melati Blok G', city: 'Bandung', province: 'Jawa Barat', postal_code: '40123',
    email: 'rt07@dev.com', phone: '081200000007',
    monthly_fee: 70000,
    bank_name: 'BNI', account_number: '1234567896', account_holder: 'RT 07 RW 05',
    qris_url: 'https://example.com/qris7.png', logo_url: 'https://example.com/logo7.png',
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    name: 'RT 08 RW 05', code: 'RT08',
    address: 'Ruko Melati Blok H', city: 'Bandung', province: 'Jawa Barat', postal_code: '40123',
    email: 'rt08@dev.com', phone: '081200000008',
    monthly_fee: 55000,
    bank_name: 'Mandiri', account_number: '1234567897', account_holder: 'RT 08 RW 05',
    qris_url: 'https://example.com/qris8.png', logo_url: 'https://example.com/logo8.png',
  },
  {
    id: '99999999-9999-9999-9999-999999999999',
    name: 'RT 09 RW 05', code: 'RT09',
    address: 'Ruko Melati Blok I', city: 'Bandung', province: 'Jawa Barat', postal_code: '40123',
    email: 'rt09@dev.com', phone: '081200000009',
    monthly_fee: 50000,
    bank_name: 'BCA', account_number: '1234567898', account_holder: 'RT 09 RW 05',
    qris_url: 'https://example.com/qris9.png', logo_url: 'https://example.com/logo9.png',
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'RT 10 RW 05', code: 'RT10',
    address: 'Ruko Melati Blok J', city: 'Bandung', province: 'Jawa Barat', postal_code: '40123',
    email: 'rt10@dev.com', phone: '081200000010',
    monthly_fee: 60000,
    bank_name: 'BRI', account_number: '1234567899', account_holder: 'RT 10 RW 05',
    qris_url: 'https://example.com/qris10.png', logo_url: 'https://example.com/logo10.png',
  },
]

const PUBLIC_USERS = [
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc1', name: 'Budi Santoso',         email: 'admin@dev.com',     created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc2', name: 'Siti Aminah',          email: 'warga@dev.com',     created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc3', name: 'Andi Wijaya',          email: 'andi@dev.com',      created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc4', name: 'Rina Marlina',         email: 'rina@dev.com',      created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc5', name: 'Dedi Kurniawan',       email: 'dedi@dev.com',      created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc6', name: 'Maya Sari',            email: 'maya@dev.com',      created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc7', name: 'Fajar Nugraha',        email: 'fajar@dev.com',     created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc8', name: 'Lina Fitriani',        email: 'lina@dev.com',      created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc9', name: 'Rudi Hartono',         email: 'rudi@dev.com',      created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc10', name: 'Nina Oktavia',         email: 'nina@dev.com',      created_at: '2026-01-03T08:00:00Z' },
  { id: U_CHAIR,                                name: 'Hendra Wijaya',        email: 'ketua@dev.com',     created_at: '2026-01-03T08:00:00Z' },
  { id: U_TREASURER,                            name: 'Dewi Rahayu',          email: 'bendahara@dev.com', created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc13', name: 'Teguh Santoso',        email: 'teguh@dev.com',     created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc14', name: 'Agus Setiawan',        email: 'agus@dev.com',      created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc15', name: 'Fitri Handayani',      email: 'fitri@dev.com',     created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc16', name: 'Bambang Supriyanto',   email: 'bambang@dev.com',   created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc17', name: 'Sri Wahyuni',          email: 'sri@dev.com',       created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc18', name: 'Wahyu Pratama',        email: 'wahyu@dev.com',     created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc19', name: 'Eka Susanti',          email: 'eka@dev.com',       created_at: '2026-01-03T08:00:00Z' },
]

const RESIDENTS = [
  // RT 01 — 10 residents
  { id: R_ADMIN,    rt_id: RT1_ID, name: 'Budi Santoso',       block: 'A', house_number: '01', email: 'admin@dev.com',     created_at: '2026-01-02T08:00:00Z' },
  { id: R_SITI,     rt_id: RT1_ID, name: 'Siti Aminah',        block: 'A', house_number: '02', email: 'warga@dev.com',     created_at: '2026-01-02T08:00:00Z' },
  { id: R_CHAIR,    rt_id: RT1_ID, name: 'Hendra Wijaya',      block: 'A', house_number: '03', email: 'ketua@dev.com',     created_at: '2026-01-02T08:00:00Z' },
  { id: R_TREASURER,rt_id: RT1_ID, name: 'Dewi Rahayu',        block: 'A', house_number: '04', email: 'bendahara@dev.com', created_at: '2026-01-02T08:00:00Z' },
  { id: R_AGUS,     rt_id: RT1_ID, name: 'Agus Setiawan',      block: 'A', house_number: '05', email: 'agus@dev.com',      created_at: '2026-01-02T08:00:00Z' },
  { id: R_FITRI,    rt_id: RT1_ID, name: 'Fitri Handayani',    block: 'A', house_number: '06', email: 'fitri@dev.com',     created_at: '2026-01-02T08:00:00Z' },
  { id: R_BAMBANG,  rt_id: RT1_ID, name: 'Bambang Supriyanto', block: 'A', house_number: '07', email: 'bambang@dev.com',   created_at: '2026-01-02T08:00:00Z' },
  { id: R_SRI,      rt_id: RT1_ID, name: 'Sri Wahyuni',        block: 'A', house_number: '08', email: 'sri@dev.com',       created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb17', rt_id: RT1_ID, name: 'Wahyu Pratama',      block: 'A', house_number: '09', email: 'wahyu@dev.com',   created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb18', rt_id: RT1_ID, name: 'Eka Susanti',        block: 'A', house_number: '10', email: 'eka@dev.com',     created_at: '2026-01-02T08:00:00Z' },
  // RT 02 — 8 residents
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', rt_id: '22222222-2222-2222-2222-222222222222', name: 'Andi Wijaya',    block: 'B', house_number: '01', email: 'andi@dev.com',  created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', rt_id: '22222222-2222-2222-2222-222222222222', name: 'Rina Marlina',   block: 'B', house_number: '02', email: 'rina@dev.com',  created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb19', rt_id: '22222222-2222-2222-2222-222222222222', name: 'Teguh Santoso',  block: 'B', house_number: '03', email: 'teguh@dev.com', created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb20', rt_id: '22222222-2222-2222-2222-222222222222', name: 'Yuni Astuti',    block: 'B', house_number: '04', email: 'yuni@dev.com',  created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb21', rt_id: '22222222-2222-2222-2222-222222222222', name: 'Dian Permata',   block: 'B', house_number: '05', email: 'dian@dev.com',  created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb22', rt_id: '22222222-2222-2222-2222-222222222222', name: 'Hadi Saputra',   block: 'B', house_number: '06', email: 'hadi@dev.com',  created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb23', rt_id: '22222222-2222-2222-2222-222222222222', name: 'Ratna Dewi',     block: 'B', house_number: '07', email: 'ratna@dev.com', created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb24', rt_id: '22222222-2222-2222-2222-222222222222', name: 'Surya Atmaja',   block: 'B', house_number: '08', email: 'surya@dev.com', created_at: '2026-01-02T08:00:00Z' },
  // RT 03 — 2 residents
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', rt_id: '33333333-3333-3333-3333-333333333333', name: 'Dedi Kurniawan', block: 'C', house_number: '01', email: 'dedi@dev.com',  created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6', rt_id: '33333333-3333-3333-3333-333333333333', name: 'Maya Sari',      block: 'C', house_number: '02', email: 'maya@dev.com',  created_at: '2026-01-02T08:00:00Z' },
  // RT 04 — 2 residents
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7', rt_id: '44444444-4444-4444-4444-444444444444', name: 'Fajar Nugraha',  block: 'D', house_number: '01', email: 'fajar@dev.com', created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb8', rt_id: '44444444-4444-4444-4444-444444444444', name: 'Lina Fitriani',  block: 'D', house_number: '02', email: 'lina@dev.com',  created_at: '2026-01-02T08:00:00Z' },
  // RT 05 — 2 residents
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb9', rt_id: '55555555-5555-5555-5555-555555555555', name: 'Rudi Hartono',   block: 'E', house_number: '01', email: 'rudi@dev.com',  created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb10', rt_id: '55555555-5555-5555-5555-555555555555', name: 'Nina Oktavia',   block: 'E', house_number: '02', email: 'nina@dev.com',  created_at: '2026-01-02T08:00:00Z' },
]

const MEMBERSHIPS = [
  { id: 'dddddddd-dddd-dddd-dddd-ddddddddddd1',  user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc1', rt_id: RT1_ID,                                   resident_id: R_ADMIN,    role: 'ADMIN',     created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-ddddddddddd2',  user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc2', rt_id: RT1_ID,                                   resident_id: R_SITI,     role: 'RESIDENT',  created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-ddddddddddd3',  user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc3', rt_id: '22222222-2222-2222-2222-222222222222',   resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', role: 'TREASURER', created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-ddddddddddd4',  user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc4', rt_id: '22222222-2222-2222-2222-222222222222',   resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', role: 'RESIDENT',  created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-ddddddddddd5',  user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc5', rt_id: '33333333-3333-3333-3333-333333333333',   resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', role: 'ADMIN',     created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-ddddddddddd6',  user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc6', rt_id: '33333333-3333-3333-3333-333333333333',   resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6', role: 'RESIDENT',  created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-ddddddddddd7',  user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc7', rt_id: '44444444-4444-4444-4444-444444444444',   resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7', role: 'TREASURER', created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-ddddddddddd8',  user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc8', rt_id: '44444444-4444-4444-4444-444444444444',   resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb8', role: 'RESIDENT',  created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-ddddddddddd9',  user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc9', rt_id: '55555555-5555-5555-5555-555555555555',   resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb9', role: 'ADMIN',     created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd10',  user_id: 'cccccccc-cccc-cccc-cccc-cccccccccc10', rt_id: '55555555-5555-5555-5555-555555555555',   resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb10', role: 'RESIDENT',  created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd11',  user_id: U_CHAIR,     rt_id: RT1_ID, resident_id: R_CHAIR,     role: 'CHAIR',     created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd12',  user_id: U_TREASURER, rt_id: RT1_ID, resident_id: R_TREASURER, role: 'TREASURER', created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd13',  user_id: 'cccccccc-cccc-cccc-cccc-cccccccccc13', rt_id: '22222222-2222-2222-2222-222222222222', resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb19', role: 'CHAIR',    created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd14',  user_id: 'cccccccc-cccc-cccc-cccc-cccccccccc14', rt_id: RT1_ID, resident_id: R_AGUS,    role: 'RESIDENT', created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd15',  user_id: 'cccccccc-cccc-cccc-cccc-cccccccccc15', rt_id: RT1_ID, resident_id: R_FITRI,   role: 'RESIDENT', created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd16',  user_id: 'cccccccc-cccc-cccc-cccc-cccccccccc16', rt_id: RT1_ID, resident_id: R_BAMBANG, role: 'RESIDENT', created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd17',  user_id: 'cccccccc-cccc-cccc-cccc-cccccccccc17', rt_id: RT1_ID, resident_id: R_SRI,     role: 'RESIDENT', created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd18',  user_id: 'cccccccc-cccc-cccc-cccc-cccccccccc18', rt_id: RT1_ID, resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb17', role: 'RESIDENT', created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd19',  user_id: 'cccccccc-cccc-cccc-cccc-cccccccccc19', rt_id: RT1_ID, resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb18', role: 'RESIDENT', created_at: '2026-01-04T08:00:00Z' },
]

// ---------------------------------------------------------------------------
// RT 01 financial data
// ---------------------------------------------------------------------------
// Payment confirmations — 6 approved, 1 pending, 1 rejected
// Approved total: 9+9+6+3+8+12 months × Rp 50,000 = Rp 2,350,000
// ---------------------------------------------------------------------------
const PAYMENT_CONFIRMATIONS = [
  // Hendra (CHAIR) — Jan–Sep (9 months) → approved
  { id: 'd1000801-0000-0000-0000-000000000000', resident_id: R_CHAIR,     rt_id: RT1_ID, year: 2026, total_amount:  450000, status: 'approved', created_at: '2026-02-01T08:00:00Z' },
  // Dewi (TREASURER) — Jan–Sep (9 months) → approved
  { id: 'd1000802-0000-0000-0000-000000000000', resident_id: R_TREASURER, rt_id: RT1_ID, year: 2026, total_amount:  450000, status: 'approved', created_at: '2026-02-01T08:15:00Z' },
  // Budi (ADMIN) — Jan–Jun (6 months) → approved
  { id: 'd1000803-0000-0000-0000-000000000000', resident_id: R_ADMIN,     rt_id: RT1_ID, year: 2026, total_amount:  300000, status: 'approved', created_at: '2026-02-05T09:00:00Z' },
  // Siti (RESIDENT) — Jan–Mar (3 months) → approved
  { id: 'd1000804-0000-0000-0000-000000000000', resident_id: R_SITI,      rt_id: RT1_ID, year: 2026, total_amount:  150000, status: 'approved', created_at: '2026-02-10T08:00:00Z' },
  // Agus (RESIDENT) — Jan–Aug (8 months) → approved
  { id: 'd1000805-0000-0000-0000-000000000000', resident_id: R_AGUS,      rt_id: RT1_ID, year: 2026, total_amount:  400000, status: 'approved', created_at: '2026-03-01T08:00:00Z' },
  // Fitri (RESIDENT) — full year Jan–Dec (12 months) → approved
  { id: 'd1000806-0000-0000-0000-000000000000', resident_id: R_FITRI,     rt_id: RT1_ID, year: 2026, total_amount:  600000, status: 'approved', created_at: '2026-01-15T08:00:00Z' },
  // Bambang (RESIDENT) — Sep only (1 month) → pending
  { id: 'd1000807-0000-0000-0000-000000000000', resident_id: R_BAMBANG,   rt_id: RT1_ID, year: 2026, total_amount:   50000, status: 'pending',  created_at: '2026-09-10T08:00:00Z' },
  // Sri (RESIDENT) — Jun (1 month) → rejected
  { id: 'd1000808-0000-0000-0000-000000000000', resident_id: R_SRI,       rt_id: RT1_ID, year: 2026, total_amount:   50000, status: 'rejected', rejected_at: '2026-06-10T10:00:00Z', rejection_reason: 'Jumlah tidak sesuai', created_at: '2026-06-08T08:00:00Z' },
]

const CONFIRMATION_DETAILS = [
  // PC1: Hendra (CHAIR) — Jan–Sep
  { id: 'd1000811-0000-0000-0000-000000000000', confirmation_id: 'd1000801-0000-0000-0000-000000000000', resident_id: R_CHAIR,     year: 2026, month:  1, amount: 50000, created_at: '2026-02-01T08:00:00Z' },
  { id: 'd1000812-0000-0000-0000-000000000000', confirmation_id: 'd1000801-0000-0000-0000-000000000000', resident_id: R_CHAIR,     year: 2026, month:  2, amount: 50000, created_at: '2026-02-01T08:00:00Z' },
  { id: 'd1000813-0000-0000-0000-000000000000', confirmation_id: 'd1000801-0000-0000-0000-000000000000', resident_id: R_CHAIR,     year: 2026, month:  3, amount: 50000, created_at: '2026-02-01T08:00:00Z' },
  { id: 'd1000814-0000-0000-0000-000000000000', confirmation_id: 'd1000801-0000-0000-0000-000000000000', resident_id: R_CHAIR,     year: 2026, month:  4, amount: 50000, created_at: '2026-02-01T08:00:00Z' },
  { id: 'd1000815-0000-0000-0000-000000000000', confirmation_id: 'd1000801-0000-0000-0000-000000000000', resident_id: R_CHAIR,     year: 2026, month:  5, amount: 50000, created_at: '2026-02-01T08:00:00Z' },
  { id: 'd1000816-0000-0000-0000-000000000000', confirmation_id: 'd1000801-0000-0000-0000-000000000000', resident_id: R_CHAIR,     year: 2026, month:  6, amount: 50000, created_at: '2026-02-01T08:00:00Z' },
  { id: 'd1000817-0000-0000-0000-000000000000', confirmation_id: 'd1000801-0000-0000-0000-000000000000', resident_id: R_CHAIR,     year: 2026, month:  7, amount: 50000, created_at: '2026-02-01T08:00:00Z' },
  { id: 'd1000818-0000-0000-0000-000000000000', confirmation_id: 'd1000801-0000-0000-0000-000000000000', resident_id: R_CHAIR,     year: 2026, month:  8, amount: 50000, created_at: '2026-02-01T08:00:00Z' },
  { id: 'd1000819-0000-0000-0000-000000000000', confirmation_id: 'd1000801-0000-0000-0000-000000000000', resident_id: R_CHAIR,     year: 2026, month:  9, amount: 50000, created_at: '2026-02-01T08:00:00Z' },
  // PC2: Dewi (TREASURER) — Jan–Sep
  { id: 'd1000821-0000-0000-0000-000000000000', confirmation_id: 'd1000802-0000-0000-0000-000000000000', resident_id: R_TREASURER, year: 2026, month:  1, amount: 50000, created_at: '2026-02-01T08:15:00Z' },
  { id: 'd1000822-0000-0000-0000-000000000000', confirmation_id: 'd1000802-0000-0000-0000-000000000000', resident_id: R_TREASURER, year: 2026, month:  2, amount: 50000, created_at: '2026-02-01T08:15:00Z' },
  { id: 'd1000823-0000-0000-0000-000000000000', confirmation_id: 'd1000802-0000-0000-0000-000000000000', resident_id: R_TREASURER, year: 2026, month:  3, amount: 50000, created_at: '2026-02-01T08:15:00Z' },
  { id: 'd1000824-0000-0000-0000-000000000000', confirmation_id: 'd1000802-0000-0000-0000-000000000000', resident_id: R_TREASURER, year: 2026, month:  4, amount: 50000, created_at: '2026-02-01T08:15:00Z' },
  { id: 'd1000825-0000-0000-0000-000000000000', confirmation_id: 'd1000802-0000-0000-0000-000000000000', resident_id: R_TREASURER, year: 2026, month:  5, amount: 50000, created_at: '2026-02-01T08:15:00Z' },
  { id: 'd1000826-0000-0000-0000-000000000000', confirmation_id: 'd1000802-0000-0000-0000-000000000000', resident_id: R_TREASURER, year: 2026, month:  6, amount: 50000, created_at: '2026-02-01T08:15:00Z' },
  { id: 'd1000827-0000-0000-0000-000000000000', confirmation_id: 'd1000802-0000-0000-0000-000000000000', resident_id: R_TREASURER, year: 2026, month:  7, amount: 50000, created_at: '2026-02-01T08:15:00Z' },
  { id: 'd1000828-0000-0000-0000-000000000000', confirmation_id: 'd1000802-0000-0000-0000-000000000000', resident_id: R_TREASURER, year: 2026, month:  8, amount: 50000, created_at: '2026-02-01T08:15:00Z' },
  { id: 'd1000829-0000-0000-0000-000000000000', confirmation_id: 'd1000802-0000-0000-0000-000000000000', resident_id: R_TREASURER, year: 2026, month:  9, amount: 50000, created_at: '2026-02-01T08:15:00Z' },
  // PC3: Budi (ADMIN) — Jan–Jun
  { id: 'd1000831-0000-0000-0000-000000000000', confirmation_id: 'd1000803-0000-0000-0000-000000000000', resident_id: R_ADMIN,     year: 2026, month:  1, amount: 50000, created_at: '2026-02-05T09:00:00Z' },
  { id: 'd1000832-0000-0000-0000-000000000000', confirmation_id: 'd1000803-0000-0000-0000-000000000000', resident_id: R_ADMIN,     year: 2026, month:  2, amount: 50000, created_at: '2026-02-05T09:00:00Z' },
  { id: 'd1000833-0000-0000-0000-000000000000', confirmation_id: 'd1000803-0000-0000-0000-000000000000', resident_id: R_ADMIN,     year: 2026, month:  3, amount: 50000, created_at: '2026-02-05T09:00:00Z' },
  { id: 'd1000834-0000-0000-0000-000000000000', confirmation_id: 'd1000803-0000-0000-0000-000000000000', resident_id: R_ADMIN,     year: 2026, month:  4, amount: 50000, created_at: '2026-02-05T09:00:00Z' },
  { id: 'd1000835-0000-0000-0000-000000000000', confirmation_id: 'd1000803-0000-0000-0000-000000000000', resident_id: R_ADMIN,     year: 2026, month:  5, amount: 50000, created_at: '2026-02-05T09:00:00Z' },
  { id: 'd1000836-0000-0000-0000-000000000000', confirmation_id: 'd1000803-0000-0000-0000-000000000000', resident_id: R_ADMIN,     year: 2026, month:  6, amount: 50000, created_at: '2026-02-05T09:00:00Z' },
  // PC4: Siti (RESIDENT) — Jan–Mar
  { id: 'd1000841-0000-0000-0000-000000000000', confirmation_id: 'd1000804-0000-0000-0000-000000000000', resident_id: R_SITI,      year: 2026, month:  1, amount: 50000, created_at: '2026-02-10T08:00:00Z' },
  { id: 'd1000842-0000-0000-0000-000000000000', confirmation_id: 'd1000804-0000-0000-0000-000000000000', resident_id: R_SITI,      year: 2026, month:  2, amount: 50000, created_at: '2026-02-10T08:00:00Z' },
  { id: 'd1000843-0000-0000-0000-000000000000', confirmation_id: 'd1000804-0000-0000-0000-000000000000', resident_id: R_SITI,      year: 2026, month:  3, amount: 50000, created_at: '2026-02-10T08:00:00Z' },
  // PC5: Agus (RESIDENT) — Jan–Aug
  { id: 'd1000851-0000-0000-0000-000000000000', confirmation_id: 'd1000805-0000-0000-0000-000000000000', resident_id: R_AGUS,      year: 2026, month:  1, amount: 50000, created_at: '2026-03-01T08:00:00Z' },
  { id: 'd1000852-0000-0000-0000-000000000000', confirmation_id: 'd1000805-0000-0000-0000-000000000000', resident_id: R_AGUS,      year: 2026, month:  2, amount: 50000, created_at: '2026-03-01T08:00:00Z' },
  { id: 'd1000853-0000-0000-0000-000000000000', confirmation_id: 'd1000805-0000-0000-0000-000000000000', resident_id: R_AGUS,      year: 2026, month:  3, amount: 50000, created_at: '2026-03-01T08:00:00Z' },
  { id: 'd1000854-0000-0000-0000-000000000000', confirmation_id: 'd1000805-0000-0000-0000-000000000000', resident_id: R_AGUS,      year: 2026, month:  4, amount: 50000, created_at: '2026-03-01T08:00:00Z' },
  { id: 'd1000855-0000-0000-0000-000000000000', confirmation_id: 'd1000805-0000-0000-0000-000000000000', resident_id: R_AGUS,      year: 2026, month:  5, amount: 50000, created_at: '2026-03-01T08:00:00Z' },
  { id: 'd1000856-0000-0000-0000-000000000000', confirmation_id: 'd1000805-0000-0000-0000-000000000000', resident_id: R_AGUS,      year: 2026, month:  6, amount: 50000, created_at: '2026-03-01T08:00:00Z' },
  { id: 'd1000857-0000-0000-0000-000000000000', confirmation_id: 'd1000805-0000-0000-0000-000000000000', resident_id: R_AGUS,      year: 2026, month:  7, amount: 50000, created_at: '2026-03-01T08:00:00Z' },
  { id: 'd1000858-0000-0000-0000-000000000000', confirmation_id: 'd1000805-0000-0000-0000-000000000000', resident_id: R_AGUS,      year: 2026, month:  8, amount: 50000, created_at: '2026-03-01T08:00:00Z' },
  // PC6: Fitri (RESIDENT) — full year Jan–Dec
  { id: 'd1000861-0000-0000-0000-000000000000', confirmation_id: 'd1000806-0000-0000-0000-000000000000', resident_id: R_FITRI,     year: 2026, month:  1, amount: 50000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'd1000862-0000-0000-0000-000000000000', confirmation_id: 'd1000806-0000-0000-0000-000000000000', resident_id: R_FITRI,     year: 2026, month:  2, amount: 50000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'd1000863-0000-0000-0000-000000000000', confirmation_id: 'd1000806-0000-0000-0000-000000000000', resident_id: R_FITRI,     year: 2026, month:  3, amount: 50000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'd1000864-0000-0000-0000-000000000000', confirmation_id: 'd1000806-0000-0000-0000-000000000000', resident_id: R_FITRI,     year: 2026, month:  4, amount: 50000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'd1000865-0000-0000-0000-000000000000', confirmation_id: 'd1000806-0000-0000-0000-000000000000', resident_id: R_FITRI,     year: 2026, month:  5, amount: 50000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'd1000866-0000-0000-0000-000000000000', confirmation_id: 'd1000806-0000-0000-0000-000000000000', resident_id: R_FITRI,     year: 2026, month:  6, amount: 50000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'd1000867-0000-0000-0000-000000000000', confirmation_id: 'd1000806-0000-0000-0000-000000000000', resident_id: R_FITRI,     year: 2026, month:  7, amount: 50000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'd1000868-0000-0000-0000-000000000000', confirmation_id: 'd1000806-0000-0000-0000-000000000000', resident_id: R_FITRI,     year: 2026, month:  8, amount: 50000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'd1000869-0000-0000-0000-000000000000', confirmation_id: 'd1000806-0000-0000-0000-000000000000', resident_id: R_FITRI,     year: 2026, month:  9, amount: 50000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'd100086a-0000-0000-0000-000000000000', confirmation_id: 'd1000806-0000-0000-0000-000000000000', resident_id: R_FITRI,     year: 2026, month: 10, amount: 50000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'd100086b-0000-0000-0000-000000000000', confirmation_id: 'd1000806-0000-0000-0000-000000000000', resident_id: R_FITRI,     year: 2026, month: 11, amount: 50000, created_at: '2026-01-15T08:00:00Z' },
  { id: 'd100086c-0000-0000-0000-000000000000', confirmation_id: 'd1000806-0000-0000-0000-000000000000', resident_id: R_FITRI,     year: 2026, month: 12, amount: 50000, created_at: '2026-01-15T08:00:00Z' },
  // PC7: Bambang — Sep (pending)
  { id: 'd1000871-0000-0000-0000-000000000000', confirmation_id: 'd1000807-0000-0000-0000-000000000000', resident_id: R_BAMBANG,   year: 2026, month:  9, amount: 50000, created_at: '2026-09-10T08:00:00Z' },
  // PC8: Sri — Jun (rejected)
  { id: 'd1000881-0000-0000-0000-000000000000', confirmation_id: 'd1000808-0000-0000-0000-000000000000', resident_id: R_SRI,       year: 2026, month:  6, amount: 50000, created_at: '2026-06-08T08:00:00Z' },
]

// ---------------------------------------------------------------------------
// Expenses — 2 to approve, 2 pending for Chair to review
// Approved total: Rp 150,000 + Rp 500,000 = Rp 650,000
// Pending total:  Rp 250,000 + Rp 100,000 = Rp 350,000
// ---------------------------------------------------------------------------
const EXPENSES = [
  { id: 'd1000901-0000-0000-0000-000000000000', rt_id: RT1_ID, date: '2026-01-10', category: 'Kebersihan',   amount:  150000, recipient: 'Pak Samsul',        description: 'Jasa kebersihan lingkungan RT bulan Januari',   active: true, status: 'pending', created_by: U_TREASURER, created_at: '2026-01-10T08:00:00Z' },
  { id: 'd1000902-0000-0000-0000-000000000000', rt_id: RT1_ID, date: '2026-01-10', category: 'Keamanan',     amount:  500000, recipient: 'Pak Haryono',       description: 'Honorarium satpam pos RT bulan Januari',        active: true, status: 'pending', created_by: U_TREASURER, created_at: '2026-01-10T08:15:00Z' },
  { id: 'd1000903-0000-0000-0000-000000000000', rt_id: RT1_ID, date: '2026-06-15', category: 'Pemeliharaan', amount:  250000, recipient: 'Toko Listrik Maju', description: 'Perbaikan lampu jalan gang A nomor 2 dan 4',    active: true, status: 'pending', created_by: U_TREASURER, created_at: '2026-06-15T08:00:00Z' },
  { id: 'd1000904-0000-0000-0000-000000000000', rt_id: RT1_ID, date: '2026-08-20', category: 'Administrasi', amount:  100000, recipient: 'Warung Bu Tini',    description: 'Konsumsi rapat warga RT tanggal 20 Agustus 2026', active: true, status: 'pending', created_by: U_TREASURER, created_at: '2026-08-20T08:00:00Z' },
]

// Expense IDs that should be approved (creates ledger debit via approve_expense RPC)
const EXPENSES_TO_APPROVE = ['d1000901-0000-0000-0000-000000000000', 'd1000902-0000-0000-0000-000000000000']

// ---------------------------------------------------------------------------
// Income transactions — 1 pending (CHAIR approves), 1 directly approved
// ---------------------------------------------------------------------------
const INCOME_TRANSACTIONS = [
  {
    id:              'd1000b01-0000-0000-0000-000000000000',
    rt_id:           RT1_ID,
    income_category: 'OTHER',
    income_name:     'Sewa lapangan bulu tangkis',
    source_type:     'ANONYMOUS',
    is_anonymous:    true,
    amount:          150000,
    received_at:     '2026-07-05',
    status:          'pending',
    created_by:      U_TREASURER,
    created_at:      '2026-07-05T10:00:00Z',
    updated_at:      '2026-07-05T10:00:00Z',
  },
  {
    id:              'd1000b02-0000-0000-0000-000000000000',
    rt_id:           RT1_ID,
    income_category: 'OTHER',
    income_name:     'Donasi warga untuk kegiatan 17 Agustus',
    source_type:     'ANONYMOUS',
    is_anonymous:    true,
    amount:          200000,
    received_at:     '2026-08-01',
    status:          'approved',
    created_by:      U_TREASURER,
    created_at:      '2026-08-01T09:00:00Z',
    updated_at:      '2026-08-01T09:00:00Z',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function createAuthUser(user, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method:  'POST',
    headers: ADMIN_HEADERS,
    body:    JSON.stringify({ id: user.id, email: user.email, password, email_confirm: true }),
  })
  const body = await res.json()
  if (res.ok) return 'created'
  if (body.code === 'email_exists' || body.msg?.includes('already been registered')) return 'exists'
  throw new Error(body.msg ?? body.message ?? JSON.stringify(body))
}

async function upsert(table, rows, conflictColumn) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: conflictColumn, ignoreDuplicates: true })
  if (error) throw new Error(`${table}: ${error.message}`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log(`Supabase: ${SUPABASE_URL}`)
console.log('=== Dev seed: creating all auth users ===\n')

let created = 0, skipped = 0, failed = 0

for (const user of [SUPER_ADMIN_AUTH, ...SAMPLE_AUTH_USERS]) {
  const password = user === SUPER_ADMIN_AUTH ? SUPER_ADMIN_AUTH.password : SAMPLE_PASSWORD
  try {
    const result = await createAuthUser(user, password)
    if (result === 'created') {
      console.log(`  ✓  ${user.email}`)
      created++
    } else {
      console.log(`  -  ${user.email} (already exists)`)
      skipped++
    }
  } catch (err) {
    console.error(`  ✗  ${user.email}: ${err.message}`)
    failed++
  }
}

console.log(`\nAuth users: ${created} created, ${skipped} already existed, ${failed} failed`)
if (failed > 0) process.exit(1)

console.log('\n=== Dev seed: inserting sample data ===\n')

await upsert('rt', RTS, 'id')
console.log(`  ✓  ${RTS.length} RTs`)

await upsert('users', PUBLIC_USERS, 'id')
console.log(`  ✓  ${PUBLIC_USERS.length} public.users`)

await upsert('residents', RESIDENTS, 'id')
console.log(`  ✓  ${RESIDENTS.length} residents`)

await upsert('memberships', MEMBERSHIPS, 'id')
console.log(`  ✓  ${MEMBERSHIPS.length} memberships`)

console.log('\n=== Dev seed: cleaning up previous RT 01 financial data ===\n')

// Delete in child → parent order so FK constraints are never violated.
// payment_details has no rt_id — fetch parent payment IDs first.
const { data: paymentRows, error: payErr } = await supabase
  .from('payments').select('id').eq('rt_id', RT1_ID)
if (payErr) throw new Error(`[cleanup payments lookup] ${payErr.message}`)
if (paymentRows?.length) {
  const ids = paymentRows.map(p => p.id)
  const { error } = await supabase.from('payment_details').delete().in('payment_id', ids)
  if (error) throw new Error(`[cleanup payment_details] ${error.message}`)
}

const CLEANUP_STEPS = [
  // table                   col                value
  ['ledger',                'rt_id',            RT1_ID],
  ['payments',              'rt_id',            RT1_ID],
  ['confirmation_details',  'confirmation_id',  PAYMENT_CONFIRMATIONS.map(r => r.id)],
  ['payment_confirmations', 'rt_id',            RT1_ID],
  ['income_transactions',   'rt_id',            RT1_ID],
  ['expenses',              'rt_id',            RT1_ID],
]

for (const [table, col, val] of CLEANUP_STEPS) {
  const q = Array.isArray(val)
    ? supabase.from(table).delete().in(col, val)
    : supabase.from(table).delete().eq(col, val)
  const { error } = await q
  if (error) throw new Error(`[cleanup ${table}] ${error.message}`)
}
console.log('  ✓  previous RT 01 financial data cleared\n')

console.log('=== Dev seed: inserting RT 01 financial data ===\n')

// Insert confirmations as pending first, then approve via RPC (same pattern as seed-pvt.mjs)
// Directly upserting status='approved' bypasses approve_confirmation(), which
// means payments, payment_details, and ledger rows are never created.
const toApprove  = PAYMENT_CONFIRMATIONS.filter(r => r.status === 'approved')
const notApprove = PAYMENT_CONFIRMATIONS.filter(r => r.status !== 'approved')
const pendingForApproval = toApprove.map(({ approved_at, ...rest }) => ({ ...rest, status: 'pending' }))
await upsert('payment_confirmations', [...pendingForApproval, ...notApprove], 'id')
console.log(`  ✓  payment_confirmations: ${PAYMENT_CONFIRMATIONS.length} rows`)

await upsert('confirmation_details', CONFIRMATION_DETAILS, 'id')
console.log(`  ✓  confirmation_details:  ${CONFIRMATION_DETAILS.length} rows`)

let pcApproved = 0
for (const pc of toApprove) {
  const { data } = await supabase.from('payment_confirmations').select('status').eq('id', pc.id).single()
  if (data?.status === 'approved') { pcApproved++; continue }
  const { error } = await supabase.rpc('approve_confirmation', {
    p_confirmation_id: pc.id,
    p_user_id:         U_TREASURER,
  })
  if (error) throw new Error(`[approve_confirmation ${pc.id}] ${error.message}`)
  pcApproved++
}
console.log(`  ✓  approved via RPC:      ${pcApproved} payment confirmations`)

// Insert all expenses as pending, then approve the two historical ones via RPC
await upsert('expenses', EXPENSES, 'id')
console.log(`  ✓  expenses:              ${EXPENSES.length} rows`)

let expApproved = 0
for (const expId of EXPENSES_TO_APPROVE) {
  const { data } = await supabase.from('expenses').select('status').eq('id', expId).single()
  if (data?.status === 'approved') { expApproved++; continue }
  const { error } = await supabase.rpc('approve_expense', {
    p_expense_id: expId,
    p_user_id:    U_CHAIR,
  })
  if (error) throw new Error(`[approve_expense ${expId}] ${error.message}`)
  expApproved++
}
console.log(`  ✓  approved via RPC:      ${expApproved} expenses`)

await upsert('income_transactions', INCOME_TRANSACTIONS, 'id')
const pendingTx = INCOME_TRANSACTIONS.filter(t => t.status === 'pending').length
console.log(`  ✓  income_transactions:   ${INCOME_TRANSACTIONS.length} rows  (${pendingTx} pending approval)`)

console.log('\n=== Dev seed complete ===\n')
console.log('Accounts (all passwords: Password123!):')
console.log('  SUPER_ADMIN : superadmin@dev.com')
console.log('  CHAIR       : ketua@dev.com        (Hendra Wijaya, RT 01)')
console.log('  TREASURER   : bendahara@dev.com    (Dewi Rahayu,   RT 01)')
console.log('  ADMIN       : admin@dev.com         (Budi Santoso,  RT 01)')
console.log('  RESIDENT    : warga@dev.com          (Siti Aminah,   RT 01)')
console.log()
console.log('RT 01 RW 05 — monthly fee: Rp 50,000 — 10 residents')
console.log('  Payment confirmations : 6 approved + 1 pending (Bambang) + 1 rejected (Sri)')
console.log('  Approved iuran income : Rp 2,350,000  (Hendra 9m + Dewi 9m + Budi 6m + Siti 3m + Agus 8m + Fitri 12m)')
console.log('  Approved expenses     : Rp   650,000  (Kebersihan Rp150k + Keamanan Rp500k)')
console.log('  Saldo Saat Ini        : Rp 1,700,000')
console.log('  Pending expenses      : Rp   350,000  (Pemeliharaan Rp250k + Administrasi Rp100k — pending Chair approval)')
console.log('  Saldo after all exp   : Rp 1,350,000  (still positive)')
console.log('  Income transactions   : 1 pending Chair approval (Sewa lapangan) + 1 already approved')
console.log()
console.log('  Residents with tunggakan (as of Sep 2026):')
console.log('    Budi   (ADMIN)    : paid Jan–Jun, owed Jul–Sep  = 3 months = Rp 150,000')
console.log('    Siti   (RESIDENT) : paid Jan–Mar, owed Apr–Sep  = 6 months = Rp 300,000')
console.log('    Bambang(RESIDENT) : pending Sep,  owed Jan–Aug  = 8 months = Rp 400,000')
console.log('    Sri    (RESIDENT) : rejected Jun,  owed Jan–Sep = 9 months = Rp 450,000')
console.log('    Wahyu  (RESIDENT) : no payment,    owed Jan–Sep = 9 months = Rp 450,000')
console.log('    Eka    (RESIDENT) : no payment,    owed Jan–Sep = 9 months = Rp 450,000')
