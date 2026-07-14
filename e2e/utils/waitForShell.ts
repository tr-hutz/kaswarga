import { type Page, expect } from '@playwright/test'

/**
 * Waits for AppShell to finish resolving auth before test interactions.
 *
 * Strategy:
 *   Wait for data-testid="shell-ready" (the authenticated <main> element) to become
 *   visible. This is only rendered when loading=false AND the user has a valid
 *   membership. If auth fails the page redirects to /login instead, which we detect
 *   and surface as an actionable error.
 *
 *   Previous approach (watching shell-spinner appear then detach) had a race: if
 *   React had not yet hydrated when waitFor('detached') ran, it returned immediately
 *   even though auth was still in flight, causing subsequent locator.click() calls
 *   to time out waiting for the toolbar to render.
 */
export async function waitForShell(page: Page, expectedPath: RegExp) {
  // shell-ready is only mounted when loading=false AND membership is truthy
  await page.locator('[data-testid="shell-ready"]').waitFor({
    state: 'visible',
    timeout: 35000,
  }).catch(async () => {
    // shell-ready never appeared — check for known failure states
    const currentURL = page.url()
    if (currentURL.includes('/login')) {
      throw new Error(
        `Auth session expired or refresh token rotated — page redirected to ${currentURL}.\n` +
        `Fix: run "npm test" (full run regenerates auth files) or "npm run test:e2e:retry" (now includes setup).\n` +
        `Do NOT use "playwright test --last-failed" directly — it skips auth setup.`
      )
    }
    const noMembership = page.locator('[data-testid="shell-no-membership"]')
    if (await noMembership.count() > 0) {
      throw new Error(
        'Test user has no RT membership. Run: npm run seed:dev to populate the database.'
      )
    }
    throw new Error(
      `shell-ready never appeared within 35 s (URL: ${currentURL}). Auth may have failed or the app crashed.`
    )
  })

  await expect(page).toHaveURL(expectedPath, { timeout: 5000 })
}
