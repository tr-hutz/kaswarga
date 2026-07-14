import { type Browser } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const SESSION_FILE = path.join(__dirname, '../.auth/session.json')
const BASE_URL     = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

/**
 * Log in as the admin test user and save a fresh storage state to session.json.
 *
 * Why always fresh-login instead of reusing the existing session:
 *  The existing session's access token may be near expiry. When a browser context
 *  loads it, Supabase's autoRefreshToken fires a background refresh — rotating the
 *  refresh token. If the beforeAll hook times out before context.storageState() is
 *  called, session.json keeps the NOW-INVALID token, and every subsequent test that
 *  loads it is redirected to /login.
 *
 *  A clean login always produces a brand-new token pair with no rotation risk.
 */
export async function refreshAdminSession(browser: Browser): Promise<void> {
    const email    = process.env.E2E_TEST_EMAIL
    const password = process.env.E2E_TEST_PASSWORD

    if (!email || !password) {
        throw new Error(
            'E2E_TEST_EMAIL / E2E_TEST_PASSWORD must be set in .env.test.local'
        )
    }

    // Explicitly pass an empty storageState so the describe block's
    // test.use({ storageState: 'session.json' }) default is not inherited.
    const context = await browser.newContext({
        baseURL: BASE_URL,
        storageState: { cookies: [], origins: [] },
    })
    const page = await context.newPage()

    await page.goto('/login')
    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[type="password"]').fill(password)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 30000 })

    fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true })
    await context.storageState({ path: SESSION_FILE })
    await context.close()
}
