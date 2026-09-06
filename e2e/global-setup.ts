import { request } from '@playwright/test'

/**
 * Warm up API route handlers that Turbopack compiles lazily.
 *
 * In dev mode, Turbopack only compiles a route handler when it receives its
 * first request. Nested dynamic routes (e.g. /api/income/donations/[id]/donate)
 * may not be compiled yet when tests first hit them, causing a 404 HTML
 * response instead of JSON. Hitting each route once here forces compilation
 * so tests get proper JSON responses throughout the run.
 */
export default async function globalSetup() {
    const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

    const context = await request.newContext({ baseURL })

    const nilId = '00000000-0000-0000-0000-000000000000'
    const routes = [
        `/api/income/donations/${nilId}/donate`,
        `/api/income/donations/${nilId}/activate`,
        `/api/income/donations/${nilId}/cancel`,
    ]

    await Promise.all(
        routes.map(route =>
            context.post(route, {
                data:    {},
                headers: { 'Content-Type': 'application/json' },
            }).catch(() => {})
        )
    )

    await context.dispose()
}
