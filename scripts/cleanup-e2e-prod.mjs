/**
 * cleanup-e2e-prod.mjs  —  full teardown
 *
 * Deletes ALL data belonging to the E2E test RT, including the RT itself,
 * residents, memberships, and all transactional records.
 *
 * Use this to completely remove the test RT from an environment (e.g. before
 * decommissioning a staging environment, or to reset a broken setup).
 * For per-run cleanup before each test suite, global-setup.prod.ts handles it.
 *
 * Usage:
 *   npm run seed:e2e:prod:cleanup            # reads .env.e2e
 *   APP_ENV=preview npm run seed:e2e:prod:cleanup  # reads .env.preview
 *
 * This operation is DESTRUCTIVE and irreversible. It will prompt for confirmation
 * unless FORCE=1 is set.
 */

import { createClient } from '@supabase/supabase-js'
import { loadEnv } from './load-env.mjs'
import readline from 'readline'

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

const E2E_RT_ID = 'e2e00000-0000-0000-0000-000000000000'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function confirm() {
  if (process.env.FORCE === '1') return
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  await new Promise((resolve, reject) => {
    rl.question(
      `\nThis will delete ALL data for test RT ${E2E_RT_ID} in ${SUPABASE_URL}.\nType "delete" to confirm: `,
      ans => {
        rl.close()
        if (ans.trim() !== 'delete') reject(new Error('Aborted'))
        else resolve()
      }
    )
  })
}

async function del(table, column, value) {
  const { error, count } = await supabase.from(table).delete({ count: 'exact' }).eq(column, value)
  if (error) throw new Error(`[delete ${table}] ${error.message}`)
  if (count) console.log(`  ✓  ${count} row(s) deleted from ${table}`)
  else       console.log(`  -  ${table}: nothing to delete`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log(`\nSupabase: ${SUPABASE_URL}  [${envFile}]`)
console.log('=== E2E prod full teardown ===')

try {
  await confirm()

  console.log('\nDeleting in FK order...\n')

  // Resolve test staff user IDs via email — independent of memberships existing
  const e2eEmails = [
    process.env.E2E_ADMIN_EMAIL,
    process.env.E2E_CHAIR_EMAIL,
    process.env.E2E_TREASURER_EMAIL,
    process.env.E2E_RESIDENT_EMAIL,
  ].filter(Boolean)
  const { data: e2eUsers } = await supabase.from('users').select('id').in('email', e2eEmails)
  const userIds = (e2eUsers ?? []).map(u => u.id)

  // Payments tree (created when E2E tests approve confirmations)
  const { data: payments } = await supabase.from('payments').select('id').eq('rt_id', E2E_RT_ID)
  if (payments?.length) {
    const ids = payments.map(p => p.id)
    await supabase.from('payment_details').delete().in('payment_id', ids)
    await supabase.from('ledger').delete().in('reference_id', ids)
    await supabase.from('payments').delete().in('id', ids)
    console.log(`  ✓  ${payments.length} payment(s) + details + ledger entries deleted`)
  } else {
    console.log('  -  no payments to delete')
  }

  // Ledger entries for expenses / income_transactions
  const { data: expenses }  = await supabase.from('expenses').select('id').eq('rt_id', E2E_RT_ID)
  const { data: incomeTxs } = await supabase.from('income_transactions').select('id').eq('rt_id', E2E_RT_ID)
  const refIds = [...(expenses ?? []), ...(incomeTxs ?? [])].map(r => r.id)
  if (refIds.length) {
    await supabase.from('ledger').delete().in('reference_id', refIds)
  }

  await del('payment_confirmations', 'rt_id',    E2E_RT_ID) // cascades to confirmation_details
  await del('income_transactions',   'rt_id',    E2E_RT_ID)
  await del('income_donations',      'rt_id',    E2E_RT_ID)
  await del('expenses',              'rt_id',    E2E_RT_ID)
  await del('memberships',           'rt_id',    E2E_RT_ID)
  await del('residents',             'rt_id',    E2E_RT_ID)
  await del('rt',                    'id',        E2E_RT_ID)

  // Remove public.users records and auth users for test staff
  if (userIds.length) {
    const { error: usersErr } = await supabase.from('users').delete().in('id', userIds)
    if (usersErr) throw new Error(`[delete users] ${usersErr.message}`)
    console.log(`  ✓  ${userIds.length} public.users record(s) deleted`)

    for (const uid of userIds) {
      const { error } = await supabase.auth.admin.deleteUser(uid)
      if (error) throw new Error(`[deleteUser ${uid}] ${error.message}`)
    }
    console.log(`  ✓  ${userIds.length} auth user(s) deleted`)
  }

  console.log('\n✓  E2E test RT fully removed.\n')
} catch (err) {
  if (err.message === 'Aborted') {
    console.log('\nAborted — nothing deleted.\n')
    process.exit(0)
  }
  console.error('\nCleanup failed:', err.message)
  process.exit(1)
}
