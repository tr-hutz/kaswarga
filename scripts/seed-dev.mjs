/**
 * seed-dev.mjs
 *
 * Full dev seed: SUPER_ADMIN + 13 sample users (auth + public data).
 * Run after `supabase db reset`:
 *
 *   npm run seed:dev
 *
 * Inserts: RT (10), public.users (19), residents (24), memberships (19)
 * Creates auth users for all 14 accounts (SUPER_ADMIN + 13 sample users).
 *
 * Safe to re-run — all inserts use ON CONFLICT DO NOTHING.
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
// Auth users
// ---------------------------------------------------------------------------
const SUPER_ADMIN_AUTH = {
  id:       'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  email:    'superuser@nodomain.com',
  password: 'superuser1234',
}

const SAMPLE_PASSWORD = 'Password123!'

const SAMPLE_AUTH_USERS = [
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc1', email: 'budi@example.com'   },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc2', email: 'siti@example.com'   },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc3', email: 'andi@example.com'   },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc4', email: 'rina@example.com'   },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc5', email: 'dedi@example.com'   },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc6', email: 'maya@example.com'   },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc7', email: 'fajar@example.com'  },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc8', email: 'lina@example.com'   },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc9', email: 'rudi@example.com'   },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc10', email: 'nina@example.com'   },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc11', email: 'hendra@example.com' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc12', email: 'dewi@example.com'   },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc13', email: 'teguh@example.com'   },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc14', email: 'agus@example.com'    },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc15', email: 'fitri@example.com'   },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc16', email: 'bambang@example.com' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc17', email: 'sri@example.com'     },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc18', email: 'wahyu@example.com'   },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc19', email: 'eka@example.com'     },
]

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------
const RTS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'RT 01 RW 05', code: 'RT01',
    address: 'Ruko Melati Blok A', city: 'Bandung', province: 'Jawa Barat', postal_code: '40123',
    email: 'rt01@example.com', phone: '081200000001',
    monthly_fee: 50000,
    bank_name: 'BCA', account_number: '1234567890', account_holder: 'RT 01 RW 05',
    qris_url: 'https://example.com/qris1.png', logo_url: 'https://example.com/logo1.png',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'RT 02 RW 05', code: 'RT02',
    address: 'Ruko Melati Blok B', city: 'Bandung', province: 'Jawa Barat', postal_code: '40123',
    email: 'rt02@example.com', phone: '081200000002',
    monthly_fee: 60000,
    bank_name: 'BRI', account_number: '1234567891', account_holder: 'RT 02 RW 05',
    qris_url: 'https://example.com/qris2.png', logo_url: 'https://example.com/logo2.png',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'RT 03 RW 05', code: 'RT03',
    address: 'Ruko Melati Blok C', city: 'Bandung', province: 'Jawa Barat', postal_code: '40123',
    email: 'rt03@example.com', phone: '081200000003',
    monthly_fee: 55000,
    bank_name: 'BNI', account_number: '1234567892', account_holder: 'RT 03 RW 05',
    qris_url: 'https://example.com/qris3.png', logo_url: 'https://example.com/logo3.png',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'RT 04 RW 05', code: 'RT04',
    address: 'Ruko Melati Blok D', city: 'Bandung', province: 'Jawa Barat', postal_code: '40123',
    email: 'rt04@example.com', phone: '081200000004',
    monthly_fee: 50000,
    bank_name: 'Mandiri', account_number: '1234567893', account_holder: 'RT 04 RW 05',
    qris_url: 'https://example.com/qris4.png', logo_url: 'https://example.com/logo4.png',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'RT 05 RW 05', code: 'RT05',
    address: 'Ruko Melati Blok E', city: 'Bandung', province: 'Jawa Barat', postal_code: '40123',
    email: 'rt05@example.com', phone: '081200000005',
    monthly_fee: 65000,
    bank_name: 'BCA', account_number: '1234567894', account_holder: 'RT 05 RW 05',
    qris_url: 'https://example.com/qris5.png', logo_url: 'https://example.com/logo5.png',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'RT 06 RW 05', code: 'RT06',
    address: 'Ruko Melati Blok F', city: 'Bandung', province: 'Jawa Barat', postal_code: '40123',
    email: 'rt06@example.com', phone: '081200000006',
    monthly_fee: 50000,
    bank_name: 'BRI', account_number: '1234567895', account_holder: 'RT 06 RW 05',
    qris_url: 'https://example.com/qris6.png', logo_url: 'https://example.com/logo6.png',
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    name: 'RT 07 RW 05', code: 'RT07',
    address: 'Ruko Melati Blok G', city: 'Bandung', province: 'Jawa Barat', postal_code: '40123',
    email: 'rt07@example.com', phone: '081200000007',
    monthly_fee: 70000,
    bank_name: 'BNI', account_number: '1234567896', account_holder: 'RT 07 RW 05',
    qris_url: 'https://example.com/qris7.png', logo_url: 'https://example.com/logo7.png',
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    name: 'RT 08 RW 05', code: 'RT08',
    address: 'Ruko Melati Blok H', city: 'Bandung', province: 'Jawa Barat', postal_code: '40123',
    email: 'rt08@example.com', phone: '081200000008',
    monthly_fee: 55000,
    bank_name: 'Mandiri', account_number: '1234567897', account_holder: 'RT 08 RW 05',
    qris_url: 'https://example.com/qris8.png', logo_url: 'https://example.com/logo8.png',
  },
  {
    id: '99999999-9999-9999-9999-999999999999',
    name: 'RT 09 RW 05', code: 'RT09',
    address: 'Ruko Melati Blok I', city: 'Bandung', province: 'Jawa Barat', postal_code: '40123',
    email: 'rt09@example.com', phone: '081200000009',
    monthly_fee: 50000,
    bank_name: 'BCA', account_number: '1234567898', account_holder: 'RT 09 RW 05',
    qris_url: 'https://example.com/qris9.png', logo_url: 'https://example.com/logo9.png',
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'RT 10 RW 05', code: 'RT10',
    address: 'Ruko Melati Blok J', city: 'Bandung', province: 'Jawa Barat', postal_code: '40123',
    email: 'rt10@example.com', phone: '081200000010',
    monthly_fee: 60000,
    bank_name: 'BRI', account_number: '1234567899', account_holder: 'RT 10 RW 05',
    qris_url: 'https://example.com/qris10.png', logo_url: 'https://example.com/logo10.png',
  },
]

const PUBLIC_USERS = [
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc1', name: 'Budi Santoso',    email: 'budi@example.com',   created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc2', name: 'Siti Aminah',     email: 'siti@example.com',   created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc3', name: 'Andi Wijaya',     email: 'andi@example.com',   created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc4', name: 'Rina Marlina',    email: 'rina@example.com',   created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc5', name: 'Dedi Kurniawan',  email: 'dedi@example.com',   created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc6', name: 'Maya Sari',       email: 'maya@example.com',   created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc7', name: 'Fajar Nugraha',   email: 'fajar@example.com',  created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc8', name: 'Lina Fitriani',   email: 'lina@example.com',   created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc9', name: 'Rudi Hartono',    email: 'rudi@example.com',   created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc10', name: 'Nina Oktavia',    email: 'nina@example.com',   created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc11', name: 'Hendra Wijaya',   email: 'hendra@example.com', created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc12', name: 'Dewi Rahayu',     email: 'dewi@example.com',   created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc13', name: 'Teguh Santoso',        email: 'teguh@example.com',   created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc14', name: 'Agus Setiawan',        email: 'agus@example.com',    created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc15', name: 'Fitri Handayani',      email: 'fitri@example.com',   created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc16', name: 'Bambang Supriyanto',   email: 'bambang@example.com', created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc17', name: 'Sri Wahyuni',          email: 'sri@example.com',     created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc18', name: 'Wahyu Pratama',        email: 'wahyu@example.com',   created_at: '2026-01-03T08:00:00Z' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc19', name: 'Eka Susanti',          email: 'eka@example.com',     created_at: '2026-01-03T08:00:00Z' },
]

const RESIDENTS = [
  // RT 01 — 10 residents
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', rt_id: '11111111-1111-1111-1111-111111111111', name: 'Budi Santoso',       block: 'A', house_number: '01', email: 'budi@example.com',    created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', rt_id: '11111111-1111-1111-1111-111111111111', name: 'Siti Aminah',        block: 'A', house_number: '02', email: 'siti@example.com',    created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb11', rt_id: '11111111-1111-1111-1111-111111111111', name: 'Hendra Wijaya',      block: 'A', house_number: '03', email: 'hendra@example.com',  created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb12', rt_id: '11111111-1111-1111-1111-111111111111', name: 'Dewi Rahayu',        block: 'A', house_number: '04', email: 'dewi@example.com',    created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb13', rt_id: '11111111-1111-1111-1111-111111111111', name: 'Agus Setiawan',      block: 'A', house_number: '05', email: 'agus@example.com',    created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb14', rt_id: '11111111-1111-1111-1111-111111111111', name: 'Fitri Handayani',    block: 'A', house_number: '06', email: 'fitri@example.com',   created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb15', rt_id: '11111111-1111-1111-1111-111111111111', name: 'Bambang Supriyanto', block: 'A', house_number: '07', email: 'bambang@example.com', created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb16', rt_id: '11111111-1111-1111-1111-111111111111', name: 'Sri Wahyuni',        block: 'A', house_number: '08', email: 'sri@example.com',     created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb17', rt_id: '11111111-1111-1111-1111-111111111111', name: 'Wahyu Pratama',      block: 'A', house_number: '09', email: 'wahyu@example.com',   created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb18', rt_id: '11111111-1111-1111-1111-111111111111', name: 'Eka Susanti',        block: 'A', house_number: '10', email: 'eka@example.com',     created_at: '2026-01-02T08:00:00Z' },
  // RT 02 — 8 residents
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', rt_id: '22222222-2222-2222-2222-222222222222', name: 'Andi Wijaya',        block: 'B', house_number: '01', email: 'andi@example.com',    created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', rt_id: '22222222-2222-2222-2222-222222222222', name: 'Rina Marlina',       block: 'B', house_number: '02', email: 'rina@example.com',    created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb19', rt_id: '22222222-2222-2222-2222-222222222222', name: 'Teguh Santoso',      block: 'B', house_number: '03', email: 'teguh@example.com',   created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb20', rt_id: '22222222-2222-2222-2222-222222222222', name: 'Yuni Astuti',        block: 'B', house_number: '04', email: 'yuni@example.com',    created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb21', rt_id: '22222222-2222-2222-2222-222222222222', name: 'Dian Permata',       block: 'B', house_number: '05', email: 'dian@example.com',    created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb22', rt_id: '22222222-2222-2222-2222-222222222222', name: 'Hadi Saputra',       block: 'B', house_number: '06', email: 'hadi@example.com',    created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb23', rt_id: '22222222-2222-2222-2222-222222222222', name: 'Ratna Dewi',         block: 'B', house_number: '07', email: 'ratna@example.com',   created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb24', rt_id: '22222222-2222-2222-2222-222222222222', name: 'Surya Atmaja',       block: 'B', house_number: '08', email: 'surya@example.com',   created_at: '2026-01-02T08:00:00Z' },
  // RT 03 — 2 residents
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', rt_id: '33333333-3333-3333-3333-333333333333', name: 'Dedi Kurniawan',     block: 'C', house_number: '01', email: 'dedi@example.com',    created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6', rt_id: '33333333-3333-3333-3333-333333333333', name: 'Maya Sari',          block: 'C', house_number: '02', email: 'maya@example.com',    created_at: '2026-01-02T08:00:00Z' },
  // RT 04 — 2 residents
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7', rt_id: '44444444-4444-4444-4444-444444444444', name: 'Fajar Nugraha',      block: 'D', house_number: '01', email: 'fajar@example.com',   created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb8', rt_id: '44444444-4444-4444-4444-444444444444', name: 'Lina Fitriani',      block: 'D', house_number: '02', email: 'lina@example.com',    created_at: '2026-01-02T08:00:00Z' },
  // RT 05 — 2 residents
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb9', rt_id: '55555555-5555-5555-5555-555555555555', name: 'Rudi Hartono',       block: 'E', house_number: '01', email: 'rudi@example.com',    created_at: '2026-01-02T08:00:00Z' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb10', rt_id: '55555555-5555-5555-5555-555555555555', name: 'Nina Oktavia',       block: 'E', house_number: '02', email: 'nina@example.com',    created_at: '2026-01-02T08:00:00Z' },
]

const MEMBERSHIPS = [
  { id: 'dddddddd-dddd-dddd-dddd-ddddddddddd1', user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc1', rt_id: '11111111-1111-1111-1111-111111111111', resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', role: 'ADMIN',     created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-ddddddddddd2', user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc2', rt_id: '11111111-1111-1111-1111-111111111111', resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', role: 'RESIDENT',  created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-ddddddddddd3', user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc3', rt_id: '22222222-2222-2222-2222-222222222222', resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', role: 'TREASURER', created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-ddddddddddd4', user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc4', rt_id: '22222222-2222-2222-2222-222222222222', resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', role: 'RESIDENT',  created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-ddddddddddd5', user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc5', rt_id: '33333333-3333-3333-3333-333333333333', resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', role: 'ADMIN',     created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-ddddddddddd6', user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc6', rt_id: '33333333-3333-3333-3333-333333333333', resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6', role: 'RESIDENT',  created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-ddddddddddd7', user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc7', rt_id: '44444444-4444-4444-4444-444444444444', resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7', role: 'TREASURER', created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-ddddddddddd8', user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc8', rt_id: '44444444-4444-4444-4444-444444444444', resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb8', role: 'RESIDENT',  created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-ddddddddddd9', user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc9', rt_id: '55555555-5555-5555-5555-555555555555', resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb9', role: 'ADMIN',     created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd10', user_id: 'cccccccc-cccc-cccc-cccc-cccccccccc10', rt_id: '55555555-5555-5555-5555-555555555555', resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb10', role: 'RESIDENT',  created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd11', user_id: 'cccccccc-cccc-cccc-cccc-cccccccccc11', rt_id: '11111111-1111-1111-1111-111111111111', resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb11', role: 'CHAIR',     created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd12', user_id: 'cccccccc-cccc-cccc-cccc-cccccccccc12', rt_id: '11111111-1111-1111-1111-111111111111', resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb12', role: 'TREASURER', created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd13', user_id: 'cccccccc-cccc-cccc-cccc-cccccccccc13', rt_id: '22222222-2222-2222-2222-222222222222', resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb19', role: 'CHAIR',    created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd14', user_id: 'cccccccc-cccc-cccc-cccc-cccccccccc14', rt_id: '11111111-1111-1111-1111-111111111111', resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb13', role: 'RESIDENT', created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd15', user_id: 'cccccccc-cccc-cccc-cccc-cccccccccc15', rt_id: '11111111-1111-1111-1111-111111111111', resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb14', role: 'RESIDENT', created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd16', user_id: 'cccccccc-cccc-cccc-cccc-cccccccccc16', rt_id: '11111111-1111-1111-1111-111111111111', resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb15', role: 'RESIDENT', created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd17', user_id: 'cccccccc-cccc-cccc-cccc-cccccccccc17', rt_id: '11111111-1111-1111-1111-111111111111', resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb16', role: 'RESIDENT', created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd18', user_id: 'cccccccc-cccc-cccc-cccc-cccccccccc18', rt_id: '11111111-1111-1111-1111-111111111111', resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb17', role: 'RESIDENT', created_at: '2026-01-04T08:00:00Z' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd19', user_id: 'cccccccc-cccc-cccc-cccc-cccccccccc19', rt_id: '11111111-1111-1111-1111-111111111111', resident_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb18', role: 'RESIDENT', created_at: '2026-01-04T08:00:00Z' },
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

console.log('\nDev seed complete.')