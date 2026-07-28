/*
 * =============================================================================
 * 006_STORAGE
 * Supabase Storage buckets for file uploads.
 * =============================================================================
 */

/* ----------------------------------------------------------------------------
 * rt-assets
 * RT QRIS and logo.
 * --------------------------------------------------------------------------- */
insert into storage.buckets (
    id, name, created_at, public,
    avif_autodetection, file_size_limit, allowed_mime_types, type
) values (
    'rt-assets',
    'rt-assets',
    now(),
    true,
    false,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp'],
    'STANDARD'
) on conflict (id) do update set
    public             = excluded.public,
    file_size_limit    = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

/* ----------------------------------------------------------------------------
 * payment-proof
 * Proof-of-payment images / PDFs uploaded by residents.
 * --------------------------------------------------------------------------- */

insert into storage.buckets (
    id, name, created_at, public,
    avif_autodetection, file_size_limit, allowed_mime_types, type
) values (
    'payment-proof',
    'payment-proof',
    now(),
    true,
    false,
    10485760,   -- 10 MB (xlsx import files can be large)
    array[
        'image/jpeg',
        'image/png',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ],
    'STANDARD'
) on conflict (id) do update set
    public             = excluded.public,
    file_size_limit    = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;


/* ----------------------------------------------------------------------------
 * expense-receipts
 * Expense receipt images / PDFs attached to expense records.
 * --------------------------------------------------------------------------- */

insert into storage.buckets (
    id, name, created_at, public,
    avif_autodetection, file_size_limit, allowed_mime_types, type
) values (
    'expense-receipts',
    'expense-receipts',
    now(),
    true,
    false,
    5242880,
    array['image/jpeg', 'image/png', 'application/pdf'],
    'STANDARD'
) on conflict (id) do update set
    public             = excluded.public,
    file_size_limit    = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
