-- =============================================================================
-- WARGA
-- =============================================================================

create policy "Allow read warga"
on "public"."warga"
for select
to authenticated
using (true);

create policy "Allow insert warga"
on "public"."warga"
for insert
to authenticated
with check (true);

create policy "Allow update warga"
on "public"."warga"
for update
to authenticated
using (true);

-- =============================================================================
-- USERS
-- =============================================================================

create policy "Allow read user"
on "public"."users"
for select
to authenticated
using (true);

-- =============================================================================
-- USER MEMBERSHIP
-- =============================================================================

create policy "membership_select_own"
on user_membership
for select
to authenticated
using (
  user_id = auth.uid()
);

-- =============================================================================
-- RT
-- =============================================================================

create policy "Allow read rt"
on "public"."rt"
for select
to authenticated
using (true);

-- =============================================================================
-- PEMBAYARAN
-- =============================================================================

create policy "Allow read pembayaran"
on "public"."pembayaran"
for select
to authenticated
using (true);

create policy "Allow insert pembayaran"
on "public"."pembayaran"
for insert
to authenticated
with check (true);

create policy "Allow delete pembayaran"
on "public"."pembayaran"
for delete
to authenticated
using (true);

-- =============================================================================
-- DETAIL PEMBAYARAN
-- =============================================================================

create policy "Allow read detail pembayaran"
on "public"."detail_pembayaran"
for select
to authenticated
using (true);

create policy "Allow insert detail pembayaran"
on "public"."detail_pembayaran"
for insert
to authenticated
with check (true);

create policy "Allow delete detail pembayaran"
on "public"."detail_pembayaran"
for delete
to authenticated
using (true);

-- =============================================================================
-- KONFIRMASI PEMBAYARAN
-- =============================================================================

create policy "Allow read konfirmasi"
on "public"."konfirmasi_pembayaran"
for select
to authenticated
using (true);

create policy "Allow insert konfirmasi"
on "public"."konfirmasi_pembayaran"
for insert
to authenticated
with check (true);

create policy "Allow update konfirmasi"
on "public"."konfirmasi_pembayaran"
for update
to authenticated
using (true);

-- =============================================================================
-- DETAIL KONFIRMASI PEMBAYARAN
-- =============================================================================

create policy "Allow read detail konfirmasi"
on "public"."detail_konfirmasi_pembayaran"
for select
to authenticated
using (true);

create policy "Allow insert detail konfirmasi"
on "public"."detail_konfirmasi_pembayaran"
for insert
to authenticated
with check (true);

-- =============================================================================
-- PENGELUARAN
-- =============================================================================

create policy "Allow read pengeluaran"
on "public"."pengeluaran"
for select
to authenticated
using (true);

create policy "Allow insert pengeluaran"
on "public"."pengeluaran"
for insert
to authenticated
with check (true);

-- =============================================================================
-- LEDGER
-- =============================================================================

create policy "Allow read ledger"
on "public"."ledger"
for select
to authenticated
using (true);

create policy "Allow insert ledger"
on "public"."ledger"
for insert
to authenticated
with check (true);

-- =============================================================================
-- NOTIFICATIONS
-- Read : each user sees only their own notifications
-- Insert: done via security-definer functions, not direct client writes
-- Update: user marks their own notifications as read
-- =============================================================================

create policy "Allow read own notifications"
on "public"."notifications"
for select
to authenticated
using (target_user_id = auth.uid());

create policy "Allow insert notifications"
on "public"."notifications"
for insert
to authenticated
with check (true);

create policy "Allow update own notifications"
on "public"."notifications"
for update
to authenticated
using (target_user_id = auth.uid())
with check (target_user_id = auth.uid());

-- =============================================================================
-- ACTIVITY LOGS
-- =============================================================================

create policy "Allow read activity"
on "public"."activity_logs"
for select
to authenticated
using (true);

create policy "Allow insert activity"
on "public"."activity_logs"
for insert
to authenticated
with check (true);

-- =============================================================================
-- FUNCTION PERMISSIONS
-- populate_cashflow and insert_ledger are internal utilities — restrict to
-- service_role only. get_last_saldo is a read-only helper for authenticated.
-- approve_konfirmasi and reject_konfirmasi are granted in 003_function.sql.
-- =============================================================================

revoke all on function populate_cashflow(int, int, int, numeric) from public;
grant execute on function populate_cashflow(int, int, int, numeric) to service_role;

revoke all on function insert_ledger(uuid, varchar, varchar, uuid, timestamptz, text, bigint, uuid) from public;
grant execute on function insert_ledger(uuid, varchar, varchar, uuid, timestamptz, text, bigint, uuid) to service_role;

revoke all on function get_last_saldo(uuid) from public;
grant execute on function get_last_saldo(uuid) to authenticated;
