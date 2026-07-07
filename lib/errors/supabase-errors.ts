// KW = Kaswarga application errors raised from DB functions (003_function.sql)
// Standard PostgreSQL error codes (23xxx, 42xxx, P0xxx, etc.)
const ERROR_MAP = {
    '23505': 'Data ini sudah terdaftar. Pembayaran untuk bulan tersebut sudah ada.',
    '23503': 'Data terkait tidak ditemukan atau sudah dihapus.',
    '42501': 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
    '42883': 'Fungsi internal tidak ditemukan.',
    'PGRST116': 'Data tidak ditemukan.',
}

export function getErrorMessage(
    err: { code?: string; message?: string; details?: { code?: string } } | null | undefined,
    fallback = 'Terjadi kesalahan. Silakan coba lagi.'
): string {
    if (!err) return fallback
    const code = err.code || err?.details?.code

    // KW codes come from our own DB validation — message is already descriptive
    if (code?.startsWith('KW')) return err.message ?? fallback

    return (code ? ERROR_MAP[code as keyof typeof ERROR_MAP] : undefined) || fallback
}