export interface ActivityParams {
    rtId?:        string | null
    actorId?:     string | null
    actorName?:   string | null
    action:       string
    entityType:   string
    entityId?:    string | null
    description:  string
    metadata?:    Record<string, unknown>
}

/*
 * Fire-and-forget activity logger. Routes through /api/activity so that
 * writes use the service role (supabaseAdmin) and are not blocked by RLS —
 * important for cases like logout where the browser session may already be
 * cleared by the time the async INSERT would otherwise run.
 */
export function logActivity(params: ActivityParams): void {
    fetch('/api/activity', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(params),
    }).catch(err => console.error('[Activity]', err))
}
