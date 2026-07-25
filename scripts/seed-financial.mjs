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
    // file not found — use env as-is
  }
}

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

console.log(`Seeding financial data for year ${year}…`)

for (const rtId of RT_IDS) {
  const { error } = await supabase.rpc('seed_dev_data', {
    p_rt_id: rtId,
    p_tahun: year,
  })
  if (error) {
    console.error(`  ✗ RT ${rtId}:`, error.message)
  } else {
    console.log(`  ✓ RT ${rtId}`)
  }
}

console.log('Done.')
