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

alter table rt                      enable row level security;
alter table users                   enable row level security;
alter table residents               enable row level security;
alter table memberships             enable row level security;
alter table payment_confirmations   enable row level security;
alter table confirmation_details    enable row level security;
alter table payments                enable row level security;
alter table payment_details         enable row level security;
alter table expenses                enable row level security;
alter table ledger                  enable row level security;
alter table notifications           enable row level security;
alter table activity_logs           enable row level security;
alter table registration_requests   enable row level security;
alter table activation_invites      enable row level security;


/* ----------------------------------------------------------------------------
 * RT
 * --------------------------------------------------------------------------- */

-- All authenticated users may read the RT list (needed for selection screens
-- and super_admin dashboards).
create policy "rt: authenticated can read"
    on rt for select to authenticated
    using (true);

-- Only SUPER_ADMIN may create RT records (via approveRtRegistration).
create policy "rt: super_admin can insert"
    on rt for insert to authenticated
    with check (is_super_admin());

-- Members of an RT (chair / admin) or SUPER_ADMIN may update its profile.
create policy "rt: members can update own rt"
    on rt for update to authenticated
    using     (id in (select get_user_rt_ids()) or is_super_admin())
    with check (id in (select get_user_rt_ids()) or is_super_admin());

-- Only SUPER_ADMIN may delete an RT (trigger also guards the system RT row).
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
 * RESIDENTS
 * --------------------------------------------------------------------------- */

create policy "warga: read own rt"
    on residents for select to authenticated
    using (rt_id in (select get_user_rt_ids()) or is_super_admin());

create policy "warga: insert own rt"
    on residents for insert to authenticated
    with check (is_member_of_rt(rt_id) or is_super_admin());

create policy "warga: update own rt"
    on residents for update to authenticated
    using     (rt_id in (select get_user_rt_ids()) or is_super_admin())
    with check (is_member_of_rt(rt_id) or is_super_admin());


/* ----------------------------------------------------------------------------
 * MEMBERSHIPS
 * Two permissive SELECT policies (Postgres ORs them):
 *   1. Any user may read their own membership row
 *   2. super_admin may read all membership rows
 * --------------------------------------------------------------------------- */

create policy "membership: read own"
    on memberships for select to authenticated
    using (user_id = auth.uid());

create policy "membership: super_admin read all"
    on memberships for select to authenticated
    using (is_super_admin());

create policy "membership: super_admin insert"
    on memberships for insert to authenticated
    with check (is_super_admin());

create policy "membership: super_admin update"
    on memberships for update to authenticated
    using (is_super_admin());

create policy "membership: super_admin delete"
    on memberships for delete to authenticated
    using (is_super_admin());


/* ----------------------------------------------------------------------------
 * PAYMENT CONFIRMATIONS
 * --------------------------------------------------------------------------- */

create policy "konfirmasi: read own rt"
    on payment_confirmations for select to authenticated
    using (rt_id in (select get_user_rt_ids()) or is_super_admin());

create policy "konfirmasi: insert own rt"
    on payment_confirmations for insert to authenticated
    with check (is_member_of_rt(rt_id) or is_super_admin());

create policy "konfirmasi: update own rt"
    on payment_confirmations for update to authenticated
    using     (rt_id in (select get_user_rt_ids()) or is_super_admin())
    with check (is_member_of_rt(rt_id) or is_super_admin());


/* ----------------------------------------------------------------------------
 * CONFIRMATION DETAILS
 * No direct rt_id — scoped through the parent payment_confirmations row.
 * --------------------------------------------------------------------------- */

create policy "detail konfirmasi: read own rt"
    on confirmation_details for select to authenticated
    using (
        confirmation_id in (
            select id from payment_confirmations
            where  rt_id in (select get_user_rt_ids())
        )
        or is_super_admin()
    );

create policy "detail konfirmasi: insert own rt"
    on confirmation_details for insert to authenticated
    with check (
        confirmation_id in (
            select id from payment_confirmations
            where  rt_id in (select get_user_rt_ids())
        )
        or is_super_admin()
    );


/* ----------------------------------------------------------------------------
 * PAYMENTS
 * Approved payment rows are immutable; no update policy is added.
 * --------------------------------------------------------------------------- */

create policy "pembayaran: read own rt"
    on payments for select to authenticated
    using (rt_id in (select get_user_rt_ids()) or is_super_admin());

-- approve_confirmation (security_definer) is the normal insert path.
create policy "pembayaran: insert own rt"
    on payments for insert to authenticated
    with check (is_member_of_rt(rt_id) or is_super_admin());


/* ----------------------------------------------------------------------------
 * PAYMENT DETAILS
 * No direct rt_id — scoped through the parent payments row.
 * --------------------------------------------------------------------------- */

create policy "detail pembayaran: read own rt"
    on payment_details for select to authenticated
    using (
        payment_id in (
            select id from payments
            where  rt_id in (select get_user_rt_ids())
        )
        or is_super_admin()
    );

create policy "detail pembayaran: insert own rt"
    on payment_details for insert to authenticated
    with check (
        payment_id in (
            select id from payments
            where  rt_id in (select get_user_rt_ids())
        )
        or is_super_admin()
    );


/* ----------------------------------------------------------------------------
 * EXPENSES
 * --------------------------------------------------------------------------- */

create policy "pengeluaran: read own rt"
    on expenses for select to authenticated
    using (rt_id in (select get_user_rt_ids()) or is_super_admin());

create policy "pengeluaran: insert own rt"
    on expenses for insert to authenticated
    with check (is_member_of_rt(rt_id) or is_super_admin());

-- Allows treasurers to edit pending expense records before approval.
create policy "pengeluaran: update own rt"
    on expenses for update to authenticated
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
 * System RT (00000000-...-0001) logs are visible to SUPER_ADMIN only.
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

-- admin / chair reads resident requests for their own RT
create policy "registration: admin read resident requests for own rt"
    on registration_requests for select to authenticated
    using (
        type  = 'resident'
        and rt_id in (
            select rt_id
            from   memberships
            where  user_id = auth.uid()
            and    role    in ('ADMIN', 'CHAIR')
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
 * payment-proof
 */

create policy "payment-proof: public read"
    on storage.objects for select to public
    using (bucket_id = 'payment-proof');

create policy "payment-proof: authenticated upload"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'payment-proof');

create policy "payment-proof: authenticated update"
    on storage.objects for update to authenticated
    using (bucket_id = 'payment-proof');

create policy "payment-proof: authenticated delete"
    on storage.objects for delete to authenticated
    using (bucket_id = 'payment-proof');


/*
 * expense-receipts
*/

create policy "expense-receipts: public read"
    on storage.objects for select to public
    using (bucket_id = 'expense-receipts');

create policy "expense-receipts: authenticated upload"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'expense-receipts');

create policy "expense-receipts: authenticated update"
    on storage.objects for update to authenticated
    using (bucket_id = 'expense-receipts');

create policy "expense-receipts: authenticated delete"
    on storage.objects for delete to authenticated
    using (bucket_id = 'expense-receipts');
