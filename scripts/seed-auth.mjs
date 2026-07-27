/**
 * seed-auth.mjs
 *
 * Creates the SUPER_ADMIN auth user via the Supabase Admin API.
 * Run after `supabase db reset`:  npm run seed:auth
 *
 * For full dev sample data (all 14 auth users + RT/residents/memberships):
 *   npm run seed:dev
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

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
    // file not found — env vars must be set in the environment
  }
}

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
  email:    'superuser@nodomain.com',
  password: 'superuser1234',
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