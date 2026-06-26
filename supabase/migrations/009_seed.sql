/*
 * =============================================================================
 * 009_SEED
 * System bootstrap data. Run once on initial setup.
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * System RT
 * A virtual RT reserved for super_admin. The UUID is hardcoded and must never
 * change — application code and migration 005_functions.sql reference it
 * directly (prevent_system_rt_delete trigger).
 * --------------------------------------------------------------------------- */

insert into rt (id, nama, kode, nominal_iuran, aktif)
values (
    '00000000-0000-0000-0000-000000000001',
    'System',
    'SYS',
    0,
    true
)
on conflict (id) do nothing;


/* ----------------------------------------------------------------------------
 * pg_cron: nightly cleanup of expired registration requests
 *
 * Requires the pg_cron extension. Enable it first in:
 *   Supabase Dashboard → Database → Extensions → pg_cron
 *
 * Then uncomment and run the line below:
 * --------------------------------------------------------------------------- */

-- select cron.schedule(
--     'cleanup-expired-registrations',
--     '0 2 * * *',
--     'select cleanup_expired_registrations()'
-- );
