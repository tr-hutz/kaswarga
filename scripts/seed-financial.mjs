/**
 * seed-financial.mjs
 *
 * Seeds financial data (payments, confirmations, expenses) for all populated RTs.
 * Calls the seed_dev_data() SQL function via service-role RPC.
 *
 * Safe to re-run — the function calls rollback_dev_data() internally first.
 *
 *   npm run seed:financial
 *   node scripts/seed-financial.mjs
 *   node scripts/seed-financial.mjs 2027   # custom year
 */

import { createClient } from '@supabase/supabase-js'
import { loadEnv } from './load-env.mjs'

loadEnv('.env.local')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ---------------------------------------------------------------------------
// Populated RTs (have at least one active member)
// ---------------------------------------------------------------------------
const RT_IDS = [
  '11111111-1111-1111-1111-111111111111', // RT 01
  '22222222-2222-2222-2222-222222222222', // RT 02
  '33333333-3333-3333-3333-333333333333', // RT 03
  '44444444-4444-4444-4444-444444444444', // RT 04
  '55555555-5555-5555-5555-555555555555', // RT 05
]

const year = parseInt(process.argv[2] ?? '2026', 10)

console.log(`Supabase: ${SUPABASE_URL}`)
console.log(`Seeding financial data for year ${year}…\n`)

let successCount = 0
for (const rtId of RT_IDS) {
  const { data, error } = await supabase.rpc('seed_dev_data', {
    p_rt_id: rtId,
    p_tahun: year,
  })
  if (error) {
    console.error(`  ✗ RT ${rtId}:`, error.message)
  } else {
    successCount++
    // seed_dev_data returns a human-readable summary string
    const summary = (data ?? '').split('\n').map(l => '    ' + l).join('\n')
    console.log(`  ✓ RT ${rtId}\n${summary}\n`)
  }
}

console.log(`\nDone — ${successCount}/${RT_IDS.length} RTs seeded.`)
console.log('Tip: re-run with a year argument to seed a different year, e.g.:')
console.log(`  npm run seed:financial 2027`)
