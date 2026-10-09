/**
 * seed-auth.mjs
 *
 * Creates the SUPER_ADMIN auth user + public.users row + membership via the Supabase Admin API.
 * Run after `supabase db reset`:  npm run seed:auth
 *
 * For full dev sample data (all 14 auth users + RT/residents/memberships):
 *   npm run seed:dev
 */

import { createClient } from '@supabase/supabase-js'
import { loadEnv }      from './load-env.mjs'

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

const HEADERS = {
  apikey:         SERVICE_ROLE_KEY,
  Authorization:  `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const SUPER_ADMIN = {
  id:       'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  email:    'superadmin@dev.com',
  password: 'Password123!',
  name:     'Super Admin',
}

console.log(`Supabase: ${SUPABASE_URL}`)
console.log('Creating SUPER_ADMIN...\n')

// 1. Auth user
const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  method:  'POST',
  headers: HEADERS,
  body:    JSON.stringify({
    id:            SUPER_ADMIN.id,
    email:         SUPER_ADMIN.email,
    password:      SUPER_ADMIN.password,
    email_confirm: true,
  }),
})

const body = await res.json()

if (res.ok) {
  console.log(`  ✓  auth user created: ${SUPER_ADMIN.email}`)
} else if (body.code === 'email_exists' || body.msg?.includes('already been registered')) {
  console.log(`  -  auth user already exists: ${SUPER_ADMIN.email}`)
} else {
  console.error(`  ✗  ${SUPER_ADMIN.email}: ${body.msg ?? body.message ?? JSON.stringify(body)}`)
  process.exit(1)
}

// 2. public.users row
const { error: userErr } = await supabase
  .from('users')
  .upsert({ id: SUPER_ADMIN.id, name: SUPER_ADMIN.name, email: SUPER_ADMIN.email }, { onConflict: 'id', ignoreDuplicates: true })

if (userErr) {
  console.error(`  ✗  public.users: ${userErr.message}`)
  process.exit(1)
}
console.log(`  ✓  public.users row upserted`)

// 3. membership (rt_id = null, role = SUPER_ADMIN)
// Cannot use upsert with onConflict on (user_id, rt_id) when rt_id is NULL
// because PostgreSQL treats NULLs as distinct in unique constraints.
const { data: existing } = await supabase
  .from('memberships')
  .select('id')
  .eq('user_id', SUPER_ADMIN.id)
  .eq('role', 'SUPER_ADMIN')
  .maybeSingle()

if (existing) {
  console.log(`  -  SUPER_ADMIN membership already exists`)
} else {
  const { error: memErr } = await supabase
    .from('memberships')
    .insert({ user_id: SUPER_ADMIN.id, rt_id: null, role: 'SUPER_ADMIN', status: 'active' })
  if (memErr) {
    console.error(`  ✗  memberships: ${memErr.message}`)
    process.exit(1)
  }
  console.log(`  ✓  SUPER_ADMIN membership created`)
}

console.log('\nDone. Login: superadmin@dev.com / Password123!')
