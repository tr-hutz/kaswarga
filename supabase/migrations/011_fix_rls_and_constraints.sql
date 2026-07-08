/*
 * =============================================================================
 * 011_FIX_RLS_AND_CONSTRAINTS
 *
 * Fixes three categories of issues found during normalization review:
 *   1. Multi-RT isolation: replaces permissive `using (true)` policies with
 *      proper rt_id-scoped access on all core data tables.
 *   2. Unique constraint on confirmation_details that prevents residents
 *      from resubmitting after a rejection.
 *   3. Missing rt_id filter in approve_konfirmasi / reject_konfirmasi when
 *      looking up the resident's user_id for notifications.
 *
 * Also adds indexes to support the new RLS subquery patterns.
 *
 * Depends on: 000–010
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * Helper functions for RT-scoped RLS policies
 * --------------------------------------------------------------------------- */

-- Returns all RT IDs the current user actively belongs to.
-- SECURITY DEFINER: queries memberships while bypassing its own RLS,
-- avoiding the circular dependency that would arise from a plain query.
create or replace function get_user_rt_ids()
returns setof uuid
language sql
security definer
stable
as $$
    select rt_id
    from   memberships
    where  user_id = auth.uid()
    and    status  = 'active'
    and    rt_id   is not null
$$;

-- Returns true when the current user is an active member of p_rt_id.
create or replace function is_member_of_rt(p_rt_id uuid)
returns boolean
language sql
security definer
stable
as $$
    select exists (
        select 1
        from   memberships
        where  user_id = auth.uid()
        and    rt_id   = p_rt_id
        and    status  = 'active'
    )
$$;

grant execute on function get_user_rt_ids()      to authenticated;
grant execute on function is_member_of_rt(uuid)  to authenticated;


/* ----------------------------------------------------------------------------
 * RT table — tighten write policies
 * --------------------------------------------------------------------------- */

drop policy if exists "rt: authenticated can insert" on rt;
drop policy if exists "rt: authenticated can update" on rt;
drop policy if exists "rt: authenticated can delete" on rt;

-- Only SUPER_ADMIN may create new RT records (via approveRtRegistration).
create policy "rt: super_admin can insert"
    on rt for insert to authenticated
    with check (is_super_admin());

-- Members of an RT (chair / admin) or SUPER_ADMIN may update its profile.
create policy "rt: members can update own rt"
    on rt for update to authenticated
    using     (id in (select get_user_rt_ids()) or is_super_admin())
    with check (id in (select get_user_rt_ids()) or is_super_admin());

-- Only SUPER_ADMIN may delete an RT (the trigger also guards the system RT).
create policy "rt: super_admin can delete"
    on rt for delete to authenticated
    using (is_super_admin());


/* ----------------------------------------------------------------------------
 * RESIDENTS — RT isolation
 * --------------------------------------------------------------------------- */

drop policy if exists "warga: authenticated can read"   on residents;
drop policy if exists "warga: authenticated can insert" on residents;
drop policy if exists "warga: authenticated can update" on residents;

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
 * PAYMENT CONFIRMATIONS — RT isolation
 * --------------------------------------------------------------------------- */

drop policy if exists "konfirmasi: authenticated can read"   on payment_confirmations;
drop policy if exists "konfirmasi: authenticated can insert" on payment_confirmations;
drop policy if exists "konfirmasi: authenticated can update" on payment_confirmations;

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
 * CONFIRMATION DETAILS — RT isolation via parent row
 * --------------------------------------------------------------------------- */

drop policy if exists "detail konfirmasi: authenticated can read"   on confirmation_details;
drop policy if exists "detail konfirmasi: authenticated can insert" on confirmation_details;

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
 * PAYMENTS — RT isolation
 * (approved payment rows are immutable; no update policy added)
 * --------------------------------------------------------------------------- */

drop policy if exists "pembayaran: authenticated can read"   on payments;
drop policy if exists "pembayaran: authenticated can insert" on payments;
drop policy if exists "pembayaran: authenticated can delete" on payments;

create policy "pembayaran: read own rt"
    on payments for select to authenticated
    using (rt_id in (select get_user_rt_ids()) or is_super_admin());

-- approve_konfirmasi (security_definer) is the normal insert path; this policy
-- covers edge cases where an authorised admin inserts directly.
create policy "pembayaran: insert own rt"
    on payments for insert to authenticated
    with check (is_member_of_rt(rt_id) or is_super_admin());


/* ----------------------------------------------------------------------------
 * PAYMENT DETAILS — RT isolation via parent row
 * --------------------------------------------------------------------------- */

drop policy if exists "detail pembayaran: authenticated can read"   on payment_details;
drop policy if exists "detail pembayaran: authenticated can insert" on payment_details;
drop policy if exists "detail pembayaran: authenticated can delete" on payment_details;

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
 * EXPENSES — RT isolation + add missing UPDATE policy
 * --------------------------------------------------------------------------- */

drop policy if exists "pengeluaran: authenticated can read"   on expenses;
drop policy if exists "pengeluaran: authenticated can insert" on expenses;
drop policy if exists "pengeluaran: update own rt"            on expenses;

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
 * LEDGER — RT isolation
 * (ledger is append-only; no update/delete policies added)
 * --------------------------------------------------------------------------- */

drop policy if exists "ledger: authenticated can read"   on ledger;
drop policy if exists "ledger: authenticated can insert" on ledger;

create policy "ledger: read own rt"
    on ledger for select to authenticated
    using (rt_id in (select get_user_rt_ids()) or is_super_admin());

-- insert_ledger (security_definer) is the normal write path; this policy
-- provides defence-in-depth against direct inserts.
create policy "ledger: insert own rt"
    on ledger for insert to authenticated
    with check (is_member_of_rt(rt_id) or is_super_admin());


/* ----------------------------------------------------------------------------
 * ACTIVITY LOGS — RT isolation
 * System RT (00000000-...-0001) logs are SUPER_ADMIN-only.
 * --------------------------------------------------------------------------- */

drop policy if exists "activity_logs: authenticated can read"   on activity_logs;
drop policy if exists "activity_logs: authenticated can insert" on activity_logs;

-- RT members see their own RT's logs; SUPER_ADMIN sees everything including
-- the system RT.
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
 * The 'admin read warga requests' policy in 007_rls already uses the correct
 * English enum values (ADMIN, CHAIR) — no change needed here.
 * --------------------------------------------------------------------------- */


/* ----------------------------------------------------------------------------
 * Fix unique constraint: confirmation_details
 *
 * The (resident_id, year, month) unique constraint on the confirmation draft
 * table permanently blocks a resident from resubmitting after rejection because
 * the rejected detail rows are never deleted.  The equivalent constraint on
 * payment_details (approved payments) is correct and stays.
 * --------------------------------------------------------------------------- */

alter table confirmation_details
    drop constraint if exists detail_konfirmasi_unique;


/* ----------------------------------------------------------------------------
 * Fix approve_konfirmasi: scoped membership lookup
 *
 * Without the rt_id filter, if a resident belongs to multiple RTs the query
 * could return the wrong memberships row, sending notifications to the
 * wrong user account.
 * --------------------------------------------------------------------------- */

create or replace function approve_konfirmasi(
    p_confirmation_id uuid,
    p_user_id         uuid
)
returns void
language plpgsql
security definer
as $$
declare
    v_confirmation   record;
    v_member         record;
    v_payment_id     uuid;
    v_monthly_fee    bigint;
    v_month_count    integer;
    v_expected_total bigint;
    v_month_str      text;
    v_month_names    text[] := array[
        'Januari', 'Februari', 'Maret',    'April',   'Mei',      'Juni',
        'Juli',    'Agustus',  'September', 'Oktober', 'November', 'Desember'
    ];
begin
    -- 1. Lock row
    select *
    into   v_confirmation
    from   payment_confirmations
    where  id = p_confirmation_id
    for update;

    if not found then
        raise exception 'Konfirmasi pembayaran tidak ditemukan'
            using errcode = 'KW001';
    end if;

    -- 2. Status check
    if v_confirmation.status != 'pending' then
        raise exception 'Konfirmasi sudah diproses'
            using errcode = 'KW002';
    end if;

    -- Fetch the resident's user account scoped to this specific RT to avoid
    -- picking the wrong row when a resident belongs to multiple RTs.
    select * into v_member
    from   memberships
    where  resident_id = v_confirmation.resident_id
    and    rt_id       = v_confirmation.rt_id;

    -- 3. Duplicate month check
    if exists (
        select 1
        from   payment_details      pd
        join   confirmation_details cd on cd.confirmation_id = p_confirmation_id
        where  pd.resident_id = v_confirmation.resident_id
        and    pd.year        = v_confirmation.year
        and    pd.month       = cd.month
    ) then
        raise exception 'Beberapa bulan yang dikonfirmasi sudah memiliki data pembayaran yang disetujui'
            using errcode = 'KW003';
    end if;

    -- 4. Total validation
    select monthly_fee into v_monthly_fee from rt where id = v_confirmation.rt_id;

    select count(*) into v_month_count
    from   confirmation_details
    where  confirmation_id = p_confirmation_id;

    v_expected_total := v_monthly_fee * v_month_count;

    if v_confirmation.total_amount > v_expected_total then
        raise exception 'Total pembayaran (%) melebihi jumlah yang seharusnya (% x % bulan = %). Selisih: %',
            v_confirmation.total_amount, v_monthly_fee, v_month_count, v_expected_total,
            (v_confirmation.total_amount - v_expected_total)
            using errcode = 'KW004';
    end if;

    if v_confirmation.total_amount < v_expected_total then
        raise exception 'Total pembayaran (%) kurang dari jumlah yang seharusnya (% x % bulan = %). Selisih: %',
            v_confirmation.total_amount, v_monthly_fee, v_month_count, v_expected_total,
            (v_expected_total - v_confirmation.total_amount)
            using errcode = 'KW005';
    end if;

    -- 5. Insert payment header
    insert into payments (resident_id, rt_id, year, total_amount, date, created_at)
    values (v_confirmation.resident_id, v_confirmation.rt_id, v_confirmation.year,
            v_confirmation.total_amount, now(), now())
    returning id into v_payment_id;

    -- 6. Copy monthly detail
    insert into payment_details (payment_id, resident_id, year, month, amount, created_at)
    select v_payment_id, d.resident_id, d.year, d.month, d.amount, now()
    from   confirmation_details d
    where  d.confirmation_id = p_confirmation_id;

    -- 7. Mark approved
    update payment_confirmations
    set    status      = 'approved',
           approved_at = now()
    where  id = p_confirmation_id;

    -- 8. Ledger entry
    perform insert_ledger(
        v_confirmation.rt_id,
        'pemasukan',
        'pembayaran',
        v_payment_id,
        now(),
        'Pembayaran iuran warga',
        v_confirmation.total_amount,
        p_user_id
    );

    -- 9. Notify resident
    select string_agg(v_month_names[month], ', ' order by month)
    into   v_month_str
    from   confirmation_details
    where  confirmation_id = p_confirmation_id;

    insert into notifications (
        rt_id, type, title, message, entity_type, entity_id, target_user_id
    ) values (
        v_confirmation.rt_id,
        'payment_approved',
        'Pembayaran Disetujui',
        'Pembayaran iuran ' || v_month_str || ' ' || v_confirmation.year || ' telah disetujui',
        'payment_confirmations',
        v_confirmation.id,
        v_member.user_id
    );
end;
$$;


/* ----------------------------------------------------------------------------
 * Fix reject_konfirmasi: scoped membership lookup (same issue as above)
 * --------------------------------------------------------------------------- */

create or replace function reject_konfirmasi(
    p_confirmation_id uuid,
    p_reason          text,
    p_user_id         uuid
)
returns void
language plpgsql
security definer
as $$
declare
    v_confirmation record;
    v_member       record;
    v_month_str    text;
    v_month_names  text[] := array[
        'Januari', 'Februari', 'Maret',    'April',   'Mei',      'Juni',
        'Juli',    'Agustus',  'September', 'Oktober', 'November', 'Desember'
    ];
begin
    -- 1. Lock row
    select * into v_confirmation
    from   payment_confirmations
    where  id = p_confirmation_id
    for update;

    if not found then
        raise exception 'Konfirmasi pembayaran tidak ditemukan'
            using errcode = 'KW001';
    end if;

    -- 2. Status check
    if v_confirmation.status != 'pending' then
        raise exception 'Konfirmasi sudah diproses'
            using errcode = 'KW002';
    end if;

    -- Fetch the resident's user account scoped to this RT.
    select * into v_member
    from   memberships
    where  resident_id = v_confirmation.resident_id
    and    rt_id       = v_confirmation.rt_id;

    -- 3. Mark rejected
    update payment_confirmations
    set    status           = 'rejected',
           rejected_at      = now(),
           rejection_reason = p_reason
    where  id = p_confirmation_id;

    -- 4. Notify resident
    select string_agg(v_month_names[month], ', ' order by month)
    into   v_month_str
    from   confirmation_details
    where  confirmation_id = p_confirmation_id;

    insert into notifications (
        rt_id, type, title, message, entity_type, entity_id, target_user_id
    ) values (
        v_confirmation.rt_id,
        'payment_rejected',
        'Pembayaran Ditolak',
        'Pembayaran iuran ' || v_month_str || ' ' || v_confirmation.year || ' ditolak' ||
            case when p_reason is not null and p_reason != ''
                 then '. Alasan: ' || p_reason
                 else ''
            end,
        'payment_confirmations',
        v_confirmation.id,
        v_member.user_id
    );
end;
$$;

revoke all     on function approve_konfirmasi(uuid, uuid)      from public;
revoke all     on function reject_konfirmasi(uuid, text, uuid) from public;
grant  execute on function approve_konfirmasi(uuid, uuid)      to authenticated;
grant  execute on function reject_konfirmasi(uuid, text, uuid) to authenticated;


/* ----------------------------------------------------------------------------
 * Indexes to support the new RLS subquery patterns
 * Each index prevents a full table scan per row evaluated by the policy.
 * --------------------------------------------------------------------------- */

-- memberships: RLS helper functions scan by user_id
create index if not exists idx_memberships_user_id
    on memberships (user_id);

-- Core data tables: scanned by rt_id in RLS predicates
create index if not exists idx_residents_rt_id
    on residents (rt_id);

create index if not exists idx_payment_confirmations_rt_id
    on payment_confirmations (rt_id);

create index if not exists idx_payments_rt_id
    on payments (rt_id);

create index if not exists idx_expenses_rt_id
    on expenses (rt_id);

create index if not exists idx_activity_logs_rt_id
    on activity_logs (rt_id);

-- Detail tables: scanned by parent FK in RLS subquery
create index if not exists idx_confirmation_details_confirmation_id
    on confirmation_details (confirmation_id);

create index if not exists idx_payment_details_payment_id
    on payment_details (payment_id);
