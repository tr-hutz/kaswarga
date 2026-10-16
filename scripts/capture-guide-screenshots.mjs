/**
 * capture-guide-screenshots.mjs
 *
 * Uses Playwright to take screenshots of key UI pages and save them to
 * scripts/guide-assets/ for use in the user-guide seed.
 *
 * Prerequisites:
 *   1. `supabase db reset` + `npm run seed:dev` completed
 *   2. `npm run dev` is running (default: http://localhost:3000)
 *
 * Usage:
 *   npm run capture:guide
 *
 * After this script finishes, run:
 *   npm run seed:guide-assets
 * to upload the images and patch [GUIDE_IMG:...] placeholders in the DB.
 */

import { chromium }          from '@playwright/test'
import { loadEnv }            from './load-env.mjs'
import { mkdirSync, existsSync } from 'node:fs'
import { join }               from 'node:path'
import { fileURLToPath }      from 'node:url'

loadEnv('.env.local')

const BASE_URL   = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
const ASSETS_DIR = join(fileURLToPath(new URL('.', import.meta.url)), 'guide-assets')
const VIEWPORT   = { width: 1280, height: 800 }

// Dev credentials (created by seed:dev)
const CHAIR_EMAIL     = 'ketua@dev.com'
const CHAIR_PASSWORD  = 'Password123!'
const WARGA_EMAIL     = 'warga@dev.com'
const WARGA_PASSWORD  = 'Password123!'

if (!existsSync(ASSETS_DIR)) mkdirSync(ASSETS_DIR, { recursive: true })

// ---------------------------------------------------------------------------
// Screenshot definitions
// Format: { file, url, role, selector?, clip?, waitFor? }
// ---------------------------------------------------------------------------
const SCREENSHOTS = [
  // --- Quick Start ---
  {
    file:     'qs-login-page.png',
    url:      '/login',
    role:     'none',
    waitFor:  'input[type="email"]',
    desc:     'Login page',
  },
  {
    file:     'qs-dashboard.png',
    url:      '/dashboard',
    role:     'chair',
    waitFor:  'h1',
    desc:     'Dashboard overview',
  },
  {
    file:     'qs-sidebar-nav.png',
    url:      '/dashboard',
    role:     'chair',
    waitFor:  'nav',
    // Capture just the left sidebar
    selector: 'aside, nav[class*="sidebar"], [data-sidebar]',
    desc:     'Sidebar navigation',
  },
  {
    file:     'qs-profile-settings.png',
    url:      '/change-password',
    role:     'chair',
    waitFor:  'h1',
    desc:     'Change password page',
  },

  // --- Features ---
  {
    file:     'feat-residents.png',
    url:      '/residents',
    role:     'chair',
    waitFor:  'table, [data-table]',
    desc:     'Residents list',
  },
  {
    file:     'feat-payments.png',
    url:      '/payments',
    role:     'chair',
    waitFor:  'table, [data-table], h1',
    desc:     'Payment confirmations',
  },
  {
    file:     'feat-expenses.png',
    url:      '/expenses',
    role:     'chair',
    waitFor:  'table, [data-table], h1',
    desc:     'Expenses list',
  },
  {
    file:     'feat-reports.png',
    url:      '/ledger',
    role:     'chair',
    waitFor:  'h1',
    desc:     'Financial reports / cash ledger',
  },
  {
    file:     'feat-members.png',
    url:      '/users',
    role:     'chair',
    waitFor:  'table, [data-table], h1',
    desc:     'Member management',
  },
  {
    file:     'feat-warga-iuran.png',
    url:      '/iuran',
    role:     'warga',
    waitFor:  'h1',
    desc:     'Resident dues history view',
  },

  // --- FAQ ---
  {
    file:     'faq-forgot-password.png',
    url:      '/forgot-password',
    role:     'none',
    waitFor:  'input[type="email"]',
    desc:     'Forgot password page',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"]',    email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 15000 })
}

async function capture(browser, shot, sessionPages) {
  const role = shot.role

  let page
  if (role === 'none') {
    // Fresh unauthenticated context
    const ctx = await browser.newContext({ viewport: VIEWPORT })
    page = await ctx.newPage()
    await page.goto(`${BASE_URL}${shot.url}`, { waitUntil: 'networkidle' })
  } else {
    page = sessionPages[role]
    await page.goto(`${BASE_URL}${shot.url}`, { waitUntil: 'networkidle' })
  }

  // Wait for content to settle
  try {
    if (shot.waitFor) await page.waitForSelector(shot.waitFor, { timeout: 15000 })
  } catch {
    console.warn(`  !  ${shot.file}: waitFor "${shot.waitFor}" timed out — capturing anyway`)
  }

  // Small pause for animations / data fetches
  await page.waitForTimeout(800)

  const dest = join(ASSETS_DIR, shot.file)

  if (shot.selector) {
    try {
      const el = await page.$(shot.selector)
      if (el) {
        await el.screenshot({ path: dest })
      } else {
        await page.screenshot({ path: dest, fullPage: false })
      }
    } catch {
      await page.screenshot({ path: dest, fullPage: false })
    }
  } else {
    await page.screenshot({ path: dest, fullPage: false })
  }

  if (role === 'none') {
    await page.context().close()
  }

  console.log(`  ✓  ${shot.file.padEnd(35)} ← ${shot.desc}`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log(`Base URL : ${BASE_URL}`)
console.log(`Output   : ${ASSETS_DIR}`)
console.log('\n=== Launching browser ===\n')

const browser = await chromium.launch({ headless: true })

// Create persistent sessions for each role so we only log in once
const chairCtx  = await browser.newContext({ viewport: VIEWPORT })
const wargaCtx  = await browser.newContext({ viewport: VIEWPORT })
const chairPage = await chairCtx.newPage()
const wargaPage = await wargaCtx.newPage()

console.log('Logging in as chair...')
await login(chairPage, CHAIR_EMAIL, CHAIR_PASSWORD)
console.log('Logging in as warga...')
await login(wargaPage, WARGA_EMAIL, WARGA_PASSWORD)

const sessionPages = { chair: chairPage, warga: wargaPage }

console.log('\n=== Capturing screenshots ===\n')

let ok = 0, failed = 0
for (const shot of SCREENSHOTS) {
  try {
    await capture(browser, shot, sessionPages)
    ok++
  } catch (err) {
    console.error(`  ✗  ${shot.file}: ${err.message}`)
    failed++
  }
}

await browser.close()

console.log(`\n=== Done: ${ok} captured, ${failed} failed ===`)
console.log('\nNext step:')
console.log('  npm run seed:guide-assets')
console.log('  (uploads images and patches [GUIDE_IMG:...] placeholders in the DB)\n')
