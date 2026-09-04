/**
 * seed-prod.mjs
 *
 * Creates the initial SUPER_ADMIN account on a production Supabase instance.
 * Run ONCE after the first deploy (all migrations must be applied first).
 *
 * Usage (interactive — recommended):
 *   npm run seed:prod
 *
 * Usage (non-interactive, for CI):
 *   SUPER_ADMIN_EMAIL=admin@yourdomain.com \
 *   SUPER_ADMIN_PASSWORD=YourStrongPassword! \
 *   npm run seed:prod -- --yes
 *
 * All inserts are idempotent — safe to re-run if something failed midway.
 */

import { createClient } from '@supabase/supabase-js'
import readline from 'readline'
import { loadEnv } from "./load-env.mjs"

loadEnv('.env.production')
loadEnv('.env.production.local')

// ---------------------------------------------------------------------------
// Interactive prompt helpers
// ---------------------------------------------------------------------------
function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(question, answer => { rl.close(); resolve(answer.trim()) })
  })
}

function askPassword(question) {
  return new Promise(resolve => {
    process.stdout.write(question)
    const stdin = process.stdin
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')
    let password = ''

    function onData(ch) {
      if (ch === '\n' || ch === '\r' || ch === '') {
        stdin.setRawMode(false)
        stdin.pause()
        stdin.removeListener('data', onData)
        process.stdout.write('\n')
        resolve(password)
      } else if (ch === '') {
        process.stdout.write('\n')
        process.exit(0)
      } else if (ch === '') {
        if (password.length > 0) {
          password = password.slice(0, -1)
          process.stdout.write('\b \b')
        }
      } else {
        password += ch
        process.stdout.write('*')
      }
    }

    stdin.on('data', onData)
  })
}

// ---------------------------------------------------------------------------
// Resolve credentials — env vars first, then interactive prompt
// ---------------------------------------------------------------------------
const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('=== KasWarga Production SUPER_ADMIN Setup ===\n')
console.log(`  Target: ${SUPABASE_URL ?? '(not set — check .env.production)'}`)
console.log()

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: Missing Supabase credentials.')
  console.error('  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be in .env.production\n')
  process.exit(1)
}

let ADMIN_EMAIL    = process.env.SUPER_ADMIN_EMAIL    ?? ''
let ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD ?? ''
const confirmed    = process.argv.includes('--yes')

if (!ADMIN_EMAIL) {
  ADMIN_EMAIL = await ask('  Super Admin email    : ')
}

if (!ADMIN_PASSWORD) {
  ADMIN_PASSWORD = await askPassword('  Super Admin password : ')
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('\nERROR: Email and password are required.\n')
  process.exit(1)
}

if (!confirmed) {
  const answer = await ask(`\nCreate SUPER_ADMIN for "${ADMIN_EMAIL}" on ${SUPABASE_URL}? [y/N] `)
  if (answer.toLowerCase() !== 'y') {
    console.log('Aborted.\n')
    process.exit(0)
  }
}

console.log()

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------
const ADMIN_HEADERS = {
  apikey:         SERVICE_ROLE_KEY,
  Authorization:  `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// System RT UUID — hardcoded in migration 009_seed.sql, must never change.
const SYSTEM_RT_ID = '00000000-0000-0000-0000-000000000001'

// ---------------------------------------------------------------------------
// Step 1 — Create auth user
// ---------------------------------------------------------------------------
console.log('Step 1: Creating auth user...')

const authRes  = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  method:  'POST',
  headers: ADMIN_HEADERS,
  body:    JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, email_confirm: true }),
})
const authBody = await authRes.json()

let authUserId

if (authRes.ok) {
  authUserId = authBody.id
  console.log(`  ✓  Auth user created (id: ${authUserId})`)
} else if (authBody.code === 'email_exists' || authBody.msg?.includes('already been registered')) {
  const listRes  = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(ADMIN_EMAIL)}`, { headers: ADMIN_HEADERS })
  const listBody = await listRes.json()
  authUserId = listBody?.users?.[0]?.id
  if (!authUserId) {
    console.error('  ✗  Auth user already exists but could not retrieve their id.')
    process.exit(1)
  }
  console.log(`  -  Auth user already exists (id: ${authUserId})`)
} else {
  console.error(`  ✗  ${authBody.msg ?? authBody.message ?? JSON.stringify(authBody)}`)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Step 2 — Insert into public.users
// ---------------------------------------------------------------------------
console.log('\nStep 2: Inserting into public.users...')

const { error: userError } = await supabase
  .from('users')
  .upsert(
    { id: authUserId, email: ADMIN_EMAIL, name: 'Super Admin' },
    { onConflict: 'id', ignoreDuplicates: true }
  )

if (userError) {
  console.error(`  ✗  ${userError.message}`)
  process.exit(1)
}
console.log('  ✓  public.users row ready')

// ---------------------------------------------------------------------------
// Step 3 — Insert into memberships
// ---------------------------------------------------------------------------
console.log('\nStep 3: Inserting SUPER_ADMIN membership...')

const { error: membershipError } = await supabase
  .from('memberships')
  .upsert(
    { user_id: authUserId, rt_id: SYSTEM_RT_ID, role: 'SUPER_ADMIN', status: 'active' },
    { onConflict: 'user_id,rt_id', ignoreDuplicates: true }
  )

if (membershipError) {
  console.error(`  ✗  ${membershipError.message}`)
  process.exit(1)
}
console.log('  ✓  Membership row ready')

// ---------------------------------------------------------------------------
// Done
// ---------------------------------------------------------------------------
console.log('\n=== Production setup complete ===\n')
console.log('Next steps:')
console.log('  1. Log in at your production URL with the credentials above.')
console.log('  2. Use the Super Admin panel to register RT(s) and invite members.')
console.log('  3. Store the password securely — it cannot be recovered.\n')
