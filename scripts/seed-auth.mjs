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
    // file not found — use defaults below
  }
}

loadEnv('.env.local')

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://bftwjxpotkmpofdruiqc.supabase.co'

const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hj04zWl196z2-SBc0'

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