// KW = Kaswarga application errors raised from DB functions (003_function.sql)
// Standard PostgreSQL error codes (23xxx, 42xxx, P0xxx, etc.)
const ERROR_MAP = {
    '23505': 'This record already exists. A payment for that month is already recorded.',
    '23503': 'Related data not found or has already been deleted.',
    '42501': 'You do not have permission to perform this action.',
    '42883': 'Internal function not found.',
    'PGRST116': 'Record not found.',
}

export function getErrorMessage(
    err: unknown,
    fallback = 'An error occurred. Please try again.'
): string {
    if (!err || typeof err !== 'object') return fallback
    const e = err as { code?: string; message?: string; details?: { code?: string } }
    const code = e.code || e?.details?.code

    // KW codes come from our own DB validation — message is already descriptive
    if (code?.startsWith('KW')) return e.message ?? fallback

    return (code ? ERROR_MAP[code as keyof typeof ERROR_MAP] : undefined) || fallback
}