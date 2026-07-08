/*
 * =============================================================================
 * 008_REALTIME
 * Enable Supabase Realtime change events for tables that need live updates.
 * =============================================================================
 */

alter publication supabase_realtime add table payment_confirmations;
alter publication supabase_realtime add table payments;
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table ledger;
alter publication supabase_realtime add table residents;
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
