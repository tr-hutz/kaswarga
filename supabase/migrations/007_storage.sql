/*
 * =============================================================================
 * 007_STORAGE
 * Supabase Storage buckets for file uploads.
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * bukti-pembayaran
 * Proof-of-payment images / PDFs uploaded by warga.
 * --------------------------------------------------------------------------- */

insert into storage.buckets (
    id, name, created_at, public,
    avif_autodetection, file_size_limit, allowed_mime_types, type
) values (
    'bukti-pembayaran',
    'bukti-pembayaran',
    now(),
    true,
    false,
    5242880,
    array['image/jpeg', 'image/png', 'application/pdf'],
    'STANDARD'
);


/* ----------------------------------------------------------------------------
 * nota-pengeluaran
 * Expense receipt images / PDFs attached to pengeluaran records.
 * --------------------------------------------------------------------------- */

insert into storage.buckets (
    id, name, created_at, public,
    avif_autodetection, file_size_limit, allowed_mime_types, type
) values (
    'nota-pengeluaran',
    'nota-pengeluaran',
    now(),
    true,
    false,
    5242880,
    array['image/jpeg', 'image/png', 'application/pdf'],
    'STANDARD'
);
