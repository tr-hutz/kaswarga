/**
 * seed-auth.mjs
 *
 * Creates the SUPER_ADMIN auth user via the Supabase Admin API.
 * Run after `supabase db reset`:  npm run seed:auth
 *
 * For full dev sample data (all 14 auth users + RT/residents/memberships):
 *   npm run seed:dev
 */

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

const HEADERS = {
  apikey:         SERVICE_ROLE_KEY,
  Authorization:  `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
}

const SUPER_ADMIN = {
  id:       'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  email:    'superadmin@example.com',
  password: 'Password123!',
}

console.log(`Supabase: ${SUPABASE_URL}`)
console.log('Creating SUPER_ADMIN auth user...\n')

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
  console.log(`  ✓  ${SUPER_ADMIN.email}`)
  console.log('\nDone: SUPER_ADMIN auth user created.')
} else if (body.code === 'email_exists' || body.msg?.includes('already been registered')) {
  console.log(`  -  ${SUPER_ADMIN.email} (already exists)`)
  console.log('\nDone: SUPER_ADMIN auth user already existed.')
} else {
  console.error(`  ✗  ${SUPER_ADMIN.email}: ${body.msg ?? body.message ?? JSON.stringify(body)}`)
  process.exit(1)
}