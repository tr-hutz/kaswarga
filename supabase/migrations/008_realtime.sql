/*
 * =============================================================================
 * 008_REALTIME
 * Enable Supabase Realtime change events for tables that need live updates.
 * =============================================================================
 */

alter publication supabase_realtime add table konfirmasi_pembayaran;
alter publication supabase_realtime add table pembayaran;
alter publication supabase_realtime add table pengeluaran;
alter publication supabase_realtime add table ledger;
alter publication supabase_realtime add table warga;
alter publication supabase_realtime add table activity_logs;

-- notifications requires FULL replica identity so UPDATE events include the
-- complete row (including is_read) on the client side.
alter publication supabase_realtime add table notifications;
alter table notifications replica identity full;

/*
 * =============================================================================
 * Realtime for registration_requests so the super_admin
 * sidebar badge and registration management page update live when a new
 * RT registration is submitted.
 * =============================================================================
 */
alter publication supabase_realtime add table registration_requests;