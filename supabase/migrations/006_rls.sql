/*
 * =============================================================================
 * 006_RLS
 * Enable row-level security and define all access policies.
 * Depends on: 000–003 (all tables), 005_functions (is_super_admin)
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * Enable RLS on all tables
 * --------------------------------------------------------------------------- */

alter table rt                           enable row level security;
alter table users                        enable row level security;
alter table warga                        enable row level security;
alter table user_membership              enable row level security;
alter table konfirmasi_pembayaran        enable row level security;
alter table detail_konfirmasi_pembayaran enable row level security;
alter table pembayaran                   enable row level security;
alter table detail_pembayaran            enable row level security;
alter table pengeluaran                  enable row level security;
alter table ledger                       enable row level security;
alter table notifications                enable row level security;
alter table activity_logs                enable row level security;
alter table registration_requests        enable row level security;
alter table activation_invites           enable row level security;


/* ----------------------------------------------------------------------------
 * RT
 * --------------------------------------------------------------------------- */

create policy "rt: authenticated can read"
    on rt for select to authenticated
    using (true);

create policy "rt: authenticated can insert"
    on rt for insert to authenticated
    with check (true);

create policy "rt: authenticated can update"
    on rt for update to authenticated
    using (true);

create policy "rt: authenticated can delete"
    on rt for delete to authenticated
    using (true);


/* ----------------------------------------------------------------------------
 * USERS
 * --------------------------------------------------------------------------- */

create policy "users: authenticated can read"
    on users for select to authenticated
    using (true);


/* ----------------------------------------------------------------------------
 * WARGA
 * --------------------------------------------------------------------------- */

create policy "warga: authenticated can read"
    on warga for select to authenticated
    using (true);

create policy "warga: authenticated can insert"
    on warga for insert to authenticated
    with check (true);

create policy "warga: authenticated can update"
    on warga for update to authenticated
    using (true);


/* ----------------------------------------------------------------------------
 * USER MEMBERSHIP
 * Two permissive SELECT policies (Postgres ORs them):
 *   1. Any user may read their own membership row
 *   2. super_admin may read all membership rows
 * --------------------------------------------------------------------------- */

create policy "membership: read own"
    on user_membership for select to authenticated
    using (user_id = auth.uid());

create policy "membership: super_admin read all"
    on user_membership for select to authenticated
    using (is_super_admin());

create policy "membership: super_admin insert"
    on user_membership for insert to authenticated
    with check (is_super_admin());

create policy "membership: super_admin update"
    on user_membership for update to authenticated
    using (is_super_admin());

create policy "membership: super_admin delete"
    on user_membership for delete to authenticated
    using (is_super_admin());


/* ----------------------------------------------------------------------------
 * KONFIRMASI PEMBAYARAN
 * --------------------------------------------------------------------------- */

create policy "konfirmasi: authenticated can read"
    on konfirmasi_pembayaran for select to authenticated
    using (true);

create policy "konfirmasi: authenticated can insert"
    on konfirmasi_pembayaran for insert to authenticated
    with check (true);

create policy "konfirmasi: authenticated can update"
    on konfirmasi_pembayaran for update to authenticated
    using (true);


/* ----------------------------------------------------------------------------
 * DETAIL KONFIRMASI PEMBAYARAN
 * --------------------------------------------------------------------------- */

create policy "detail konfirmasi: authenticated can read"
    on detail_konfirmasi_pembayaran for select to authenticated
    using (true);

create policy "detail konfirmasi: authenticated can insert"
    on detail_konfirmasi_pembayaran for insert to authenticated
    with check (true);


/* ----------------------------------------------------------------------------
 * PEMBAYARAN
 * --------------------------------------------------------------------------- */

create policy "pembayaran: authenticated can read"
    on pembayaran for select to authenticated
    using (true);

create policy "pembayaran: authenticated can insert"
    on pembayaran for insert to authenticated
    with check (true);

create policy "pembayaran: authenticated can delete"
    on pembayaran for delete to authenticated
    using (true);


/* ----------------------------------------------------------------------------
 * DETAIL PEMBAYARAN
 * --------------------------------------------------------------------------- */

create policy "detail pembayaran: authenticated can read"
    on detail_pembayaran for select to authenticated
    using (true);

create policy "detail pembayaran: authenticated can insert"
    on detail_pembayaran for insert to authenticated
    with check (true);

create policy "detail pembayaran: authenticated can delete"
    on detail_pembayaran for delete to authenticated
    using (true);


/* ----------------------------------------------------------------------------
 * PENGELUARAN
 * --------------------------------------------------------------------------- */

create policy "pengeluaran: authenticated can read"
    on pengeluaran for select to authenticated
    using (true);

create policy "pengeluaran: authenticated can insert"
    on pengeluaran for insert to authenticated
    with check (true);


/* ----------------------------------------------------------------------------
 * LEDGER
 * --------------------------------------------------------------------------- */

create policy "ledger: authenticated can read"
    on ledger for select to authenticated
    using (true);

create policy "ledger: authenticated can insert"
    on ledger for insert to authenticated
    with check (true);


/* ----------------------------------------------------------------------------
 * NOTIFICATIONS
 * Users only see their own notifications; updates are limited to own rows.
 * --------------------------------------------------------------------------- */

create policy "notifications: read own"
    on notifications for select to authenticated
    using (target_user_id = auth.uid());

create policy "notifications: authenticated can insert"
    on notifications for insert to authenticated
    with check (true);

create policy "notifications: update own"
    on notifications for update to authenticated
    using     (target_user_id = auth.uid())
    with check (target_user_id = auth.uid());


/* ----------------------------------------------------------------------------
 * ACTIVITY LOGS
 * --------------------------------------------------------------------------- */

create policy "activity_logs: authenticated can read"
    on activity_logs for select to authenticated
    using (true);

create policy "activity_logs: authenticated can insert"
    on activity_logs for insert to authenticated
    with check (true);


/* ----------------------------------------------------------------------------
 * REGISTRATION REQUESTS
 * --------------------------------------------------------------------------- */

-- super_admin reads all RT registration requests
create policy "registration: super_admin read rt requests"
    on registration_requests for select to authenticated
    using (type = 'rt' and is_super_admin());

-- admin / ketua reads warga requests for their own RT
create policy "registration: admin read warga requests for own rt"
    on registration_requests for select to authenticated
    using (
        type  = 'warga'
        and rt_id in (
            select rt_id
            from   user_membership
            where  user_id = auth.uid()
            and    role    in ('admin', 'ketua')
        )
    );

-- Anyone (including unauthenticated) may submit a registration request
create policy "registration: anyone can submit"
    on registration_requests for insert
    to anon, authenticated
    with check (true);

-- Authenticated users (admins / super_admin) update status
create policy "registration: authenticated can update"
    on registration_requests for update to authenticated
    using (true);

-- Hard-delete allowed for authenticated (e.g. rejected warga requests)
create policy "registration: authenticated can delete"
    on registration_requests for delete to authenticated
    using (true);


/* ----------------------------------------------------------------------------
 * ACTIVATION INVITES
 * --------------------------------------------------------------------------- */

create policy "activation_invites: anyone can read"
    on activation_invites for select
    to anon, authenticated
    using (true);

create policy "activation_invites: authenticated can insert"
    on activation_invites for insert to authenticated
    with check (true);

create policy "activation_invites: authenticated can update"
    on activation_invites for update to authenticated
    using (true);
