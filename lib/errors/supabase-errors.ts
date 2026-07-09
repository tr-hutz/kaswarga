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
    err: { code?: string; message?: string; details?: { code?: string } } | null | undefined,
    fallback = 'An error occurred. Please try again.'
): string {
    if (!err) return fallback
    const code = err.code || err?.details?.code

    // KW codes come from our own DB validation — message is already descriptive
    if (code?.startsWith('KW')) return err.message ?? fallback

    return (code ? ERROR_MAP[code as keyof typeof ERROR_MAP] : undefined) || fallback
}