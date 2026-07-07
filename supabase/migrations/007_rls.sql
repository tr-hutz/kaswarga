/*
 * =============================================================================
 * 007_RLS
 * Enable row-level security and define all access policies.
 * Depends on: 000–003 (all tables), 005_functions (is_super_admin,
 *             get_user_rt_ids, is_member_of_rt)
 *
 * Design: each data table is scoped to the user's RT memberships.
 *   - SELECT  : rt_id in (select get_user_rt_ids())  OR  is_super_admin()
 *   - INSERT  : is_member_of_rt(rt_id)               OR  is_super_admin()
 *   - UPDATE  : same as SELECT (using) + INSERT (with check)
 *
 * Detail tables (no direct rt_id column) scope through their parent row.
 *
 * Role-based access within an RT (e.g. treasurer-only actions) is enforced
 * at the service/application layer per PERMISSION_MATRIX.md.
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

-- All authenticated users may read the RT list (needed for selection screens
-- and super_admin dashboards).
create policy "rt: authenticated can read"
    on rt for select to authenticated
    using (true);

-- Only super_admin may create RT records (via approveRtRegistration).
create policy "rt: super_admin can insert"
    on rt for insert to authenticated
    with check (is_super_admin());

-- Members of an RT (chair / admin) or super_admin may update its profile.
create policy "rt: members can update own rt"
    on rt for update to authenticated
    using     (id in (select get_user_rt_ids()) or is_super_admin())
    with check (id in (select get_user_rt_ids()) or is_super_admin());

-- Only super_admin may delete an RT (trigger also guards the system RT row).
create policy "rt: super_admin can delete"
    on rt for delete to authenticated
    using (is_super_admin());


/* ----------------------------------------------------------------------------
 * USERS
 * --------------------------------------------------------------------------- */

-- All authenticated users may read user profiles (needed for name lookups
-- across the app).
create policy "users: authenticated can read"
    on users for select to authenticated
    using (true);


/* ----------------------------------------------------------------------------
 * WARGA
 * --------------------------------------------------------------------------- */

create policy "warga: read own rt"
    on warga for select to authenticated
    using (rt_id in (select get_user_rt_ids()) or is_super_admin());

create policy "warga: insert own rt"
    on warga for insert to authenticated
    with check (is_member_of_rt(rt_id) or is_super_admin());

create policy "warga: update own rt"
    on warga for update to authenticated
    using     (rt_id in (select get_user_rt_ids()) or is_super_admin())
    with check (is_member_of_rt(rt_id) or is_super_admin());


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

create policy "konfirmasi: read own rt"
    on konfirmasi_pembayaran for select to authenticated
    using (rt_id in (select get_user_rt_ids()) or is_super_admin());

create policy "konfirmasi: insert own rt"
    on konfirmasi_pembayaran for insert to authenticated
    with check (is_member_of_rt(rt_id) or is_super_admin());

create policy "konfirmasi: update own rt"
    on konfirmasi_pembayaran for update to authenticated
    using     (rt_id in (select get_user_rt_ids()) or is_super_admin())
    with check (is_member_of_rt(rt_id) or is_super_admin());


/* ----------------------------------------------------------------------------
 * DETAIL KONFIRMASI PEMBAYARAN
 * No direct rt_id — scoped through the parent konfirmasi row.
 * --------------------------------------------------------------------------- */

create policy "detail konfirmasi: read own rt"
    on detail_konfirmasi_pembayaran for select to authenticated
    using (
        konfirmasi_id in (
            select id from konfirmasi_pembayaran
            where  rt_id in (select get_user_rt_ids())
        )
        or is_super_admin()
    );

create policy "detail konfirmasi: insert own rt"
    on detail_konfirmasi_pembayaran for insert to authenticated
    with check (
        konfirmasi_id in (
            select id from konfirmasi_pembayaran
            where  rt_id in (select get_user_rt_ids())
        )
        or is_super_admin()
    );


/* ----------------------------------------------------------------------------
 * PEMBAYARAN
 * Approved payment rows are immutable; no update policy is added.
 * --------------------------------------------------------------------------- */

create policy "pembayaran: read own rt"
    on pembayaran for select to authenticated
    using (rt_id in (select get_user_rt_ids()) or is_super_admin());

-- approve_konfirmasi (security_definer) is the normal insert path.
create policy "pembayaran: insert own rt"
    on pembayaran for insert to authenticated
    with check (is_member_of_rt(rt_id) or is_super_admin());


/* ----------------------------------------------------------------------------
 * DETAIL PEMBAYARAN
 * No direct rt_id — scoped through the parent pembayaran row.
 * --------------------------------------------------------------------------- */

create policy "detail pembayaran: read own rt"
    on detail_pembayaran for select to authenticated
    using (
        pembayaran_id in (
            select id from pembayaran
            where  rt_id in (select get_user_rt_ids())
        )
        or is_super_admin()
    );

create policy "detail pembayaran: insert own rt"
    on detail_pembayaran for insert to authenticated
    with check (
        pembayaran_id in (
            select id from pembayaran
            where  rt_id in (select get_user_rt_ids())
        )
        or is_super_admin()
    );


/* ----------------------------------------------------------------------------
 * PENGELUARAN
 * --------------------------------------------------------------------------- */

create policy "pengeluaran: read own rt"
    on pengeluaran for select to authenticated
    using (rt_id in (select get_user_rt_ids()) or is_super_admin());

create policy "pengeluaran: insert own rt"
    on pengeluaran for insert to authenticated
    with check (is_member_of_rt(rt_id) or is_super_admin());

-- Allows treasurers to edit pending expense records before approval.
create policy "pengeluaran: update own rt"
    on pengeluaran for update to authenticated
    using     (rt_id in (select get_user_rt_ids()) or is_super_admin())
    with check (is_member_of_rt(rt_id) or is_super_admin());


/* ----------------------------------------------------------------------------
 * LEDGER
 * Ledger is append-only; no update or delete policies.
 * insert_ledger (security_definer) is the normal write path.
 * --------------------------------------------------------------------------- */

create policy "ledger: read own rt"
    on ledger for select to authenticated
    using (rt_id in (select get_user_rt_ids()) or is_super_admin());

create policy "ledger: insert own rt"
    on ledger for insert to authenticated
    with check (is_member_of_rt(rt_id) or is_super_admin());


/* ----------------------------------------------------------------------------
 * NOTIFICATIONS
 * Users only see and modify their own notifications.
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
 * RT members see their own RT's logs.
 * System RT (00000000-...-0001) logs are visible to super_admin only.
 * --------------------------------------------------------------------------- */

create policy "activity_logs: read own rt"
    on activity_logs for select to authenticated
    using (
        (
            rt_id != '00000000-0000-0000-0000-000000000001'
            and rt_id in (select get_user_rt_ids())
        )
        or is_super_admin()
    );

create policy "activity_logs: insert own rt"
    on activity_logs for insert to authenticated
    with check (
        rt_id in (select get_user_rt_ids())
        or (rt_id = '00000000-0000-0000-0000-000000000001' and is_super_admin())
    );


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

/* ----------------------------------------------------------------------------
 * Storage policies
 * --------------------------------------------------------------------------- */

/*
 * rt-assets
 */
create policy "rt-assets: public read"
    on storage.objects for select to public
    using (bucket_id = 'rt-assets');

create policy "rt-assets: authenticated upload"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'rt-assets');

create policy "rt-assets: authenticated update"
    on storage.objects for update to authenticated
    using (bucket_id = 'rt-assets');

create policy "rt-assets: authenticated delete"
    on storage.objects for delete to authenticated
    using (bucket_id = 'rt-assets');

/*
 * bukti-pembayaran
 */

create policy "bukti-pembayaran: public read"
    on storage.objects for select to public
    using (bucket_id = 'bukti-pembayaran');

create policy "bukti-pembayaran: authenticated upload"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'bukti-pembayaran');

create policy "bukti-pembayaran: authenticated update"
    on storage.objects for update to authenticated
    using (bucket_id = 'bukti-pembayaran');

create policy "bukti-pembayaran: authenticated delete"
    on storage.objects for delete to authenticated
    using (bucket_id = 'bukti-pembayaran');


/*
 * nota-pengeluaran
*/

create policy "nota-pengeluaran: public read"
    on storage.objects for select to public
    using (bucket_id = 'nota-pengeluaran');

create policy "nota-pengeluaran: authenticated upload"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'nota-pengeluaran');

create policy "nota-pengeluaran: authenticated update"
    on storage.objects for update to authenticated
    using (bucket_id = 'nota-pengeluaran');

create policy "nota-pengeluaran: authenticated delete"
    on storage.objects for delete to authenticated
    using (bucket_id = 'nota-pengeluaran');
