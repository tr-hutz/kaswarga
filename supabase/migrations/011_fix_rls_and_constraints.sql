/*
 * =============================================================================
 * 011_FIX_RLS_AND_CONSTRAINTS
 *
 * Fixes three categories of issues found during normalization review:
 *   1. Multi-RT isolation: replaces permissive `using (true)` policies with
 *      proper rt_id-scoped access on all core data tables.
 *   2. Unique constraint on detail_konfirmasi_pembayaran that prevents warga
 *      from resubmitting after a rejection.
 *   3. Missing rt_id filter in approve_konfirmasi / reject_konfirmasi when
 *      looking up the warga's user_id for notifications.
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
-- SECURITY DEFINER: queries user_membership while bypassing its own RLS,
-- avoiding the circular dependency that would arise from a plain query.
create or replace function get_user_rt_ids()
returns setof uuid
language sql
security definer
stable
as $$
    select rt_id
    from   user_membership
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
        from   user_membership
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

-- Only super_admin may create new RT records (via approveRtRegistration).
create policy "rt: super_admin can insert"
    on rt for insert to authenticated
    with check (is_super_admin());

-- Members of an RT (chair / admin) or super_admin may update its profile.
create policy "rt: members can update own rt"
    on rt for update to authenticated
    using     (id in (select get_user_rt_ids()) or is_super_admin())
    with check (id in (select get_user_rt_ids()) or is_super_admin());

-- Only super_admin may delete an RT (the trigger also guards the system RT).
create policy "rt: super_admin can delete"
    on rt for delete to authenticated
    using (is_super_admin());


/* ----------------------------------------------------------------------------
 * WARGA — RT isolation
 * --------------------------------------------------------------------------- */

drop policy if exists "warga: authenticated can read"   on warga;
drop policy if exists "warga: authenticated can insert" on warga;
drop policy if exists "warga: authenticated can update" on warga;

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
 * KONFIRMASI PEMBAYARAN — RT isolation
 * --------------------------------------------------------------------------- */

drop policy if exists "konfirmasi: authenticated can read"   on konfirmasi_pembayaran;
drop policy if exists "konfirmasi: authenticated can insert" on konfirmasi_pembayaran;
drop policy if exists "konfirmasi: authenticated can update" on konfirmasi_pembayaran;

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
 * DETAIL KONFIRMASI PEMBAYARAN — RT isolation via parent row
 * --------------------------------------------------------------------------- */

drop policy if exists "detail konfirmasi: authenticated can read"   on detail_konfirmasi_pembayaran;
drop policy if exists "detail konfirmasi: authenticated can insert" on detail_konfirmasi_pembayaran;

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
 * PEMBAYARAN — RT isolation
 * (approved payment rows are immutable; no update policy added)
 * --------------------------------------------------------------------------- */

drop policy if exists "pembayaran: authenticated can read"   on pembayaran;
drop policy if exists "pembayaran: authenticated can insert" on pembayaran;
drop policy if exists "pembayaran: authenticated can delete" on pembayaran;

create policy "pembayaran: read own rt"
    on pembayaran for select to authenticated
    using (rt_id in (select get_user_rt_ids()) or is_super_admin());

-- approve_konfirmasi (security_definer) is the normal insert path; this policy
-- covers edge cases where an authorised admin inserts directly.
create policy "pembayaran: insert own rt"
    on pembayaran for insert to authenticated
    with check (is_member_of_rt(rt_id) or is_super_admin());


/* ----------------------------------------------------------------------------
 * DETAIL PEMBAYARAN — RT isolation via parent row
 * --------------------------------------------------------------------------- */

drop policy if exists "detail pembayaran: authenticated can read"   on detail_pembayaran;
drop policy if exists "detail pembayaran: authenticated can insert" on detail_pembayaran;
drop policy if exists "detail pembayaran: authenticated can delete" on detail_pembayaran;

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
 * PENGELUARAN — RT isolation + add missing UPDATE policy
 * --------------------------------------------------------------------------- */

drop policy if exists "pengeluaran: authenticated can read"   on pengeluaran;
drop policy if exists "pengeluaran: authenticated can insert" on pengeluaran;
drop policy if exists "pengeluaran: update own rt"            on pengeluaran;

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
 * System RT (00000000-...-0001) logs are super_admin-only.
 * --------------------------------------------------------------------------- */

drop policy if exists "activity_logs: authenticated can read"   on activity_logs;
drop policy if exists "activity_logs: authenticated can insert" on activity_logs;

-- RT members see their own RT's logs; super_admin sees everything including
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
 * Update the warga-request SELECT policy to use the correct role names
 * (ketua / admin still apply until the Phase-1 rename migration).
 * --------------------------------------------------------------------------- */

-- No change needed here — the existing policies are already correct for now.
-- After Phase-1 enum rename, update role values from 'ketua'/'admin' to
-- 'CHAIR'/'ADMIN'.


/* ----------------------------------------------------------------------------
 * Fix unique constraint: detail_konfirmasi_pembayaran
 *
 * The (warga_id, tahun, bulan) unique constraint on the confirmation draft
 * table permanently blocks a warga from resubmitting after rejection because
 * the rejected detail rows are never deleted.  The equivalent constraint on
 * detail_pembayaran (approved payments) is correct and stays.
 * --------------------------------------------------------------------------- */

alter table detail_konfirmasi_pembayaran
    drop constraint if exists detail_konfirmasi_unique;


/* ----------------------------------------------------------------------------
 * Fix approve_konfirmasi: scoped membership lookup
 *
 * Without the rt_id filter, if a warga belongs to multiple RTs the query
 * could return the wrong user_membership row, sending notifications to the
 * wrong user account.
 * --------------------------------------------------------------------------- */

create or replace function approve_konfirmasi(
    p_konfirmasi_id uuid,
    p_user_id       uuid
)
returns void
language plpgsql
security definer
as $$
declare
    v_konfirmasi     record;
    v_warga          record;
    v_pembayaran_id  uuid;
    v_nominal_iuran  bigint;
    v_jumlah_bulan   integer;
    v_expected_total bigint;
    v_bulan_str      text;
    v_bulan_names    text[] := array[
        'Januari', 'Februari', 'Maret',    'April',   'Mei',      'Juni',
        'Juli',    'Agustus',  'September', 'Oktober', 'November', 'Desember'
    ];
begin
    -- 1. Lock row
    select *
    into   v_konfirmasi
    from   konfirmasi_pembayaran
    where  id = p_konfirmasi_id
    for update;

    if not found then
        raise exception 'Konfirmasi pembayaran tidak ditemukan'
            using errcode = 'KW001';
    end if;

    -- 2. Status check
    if v_konfirmasi.status != 'pending' then
        raise exception 'Konfirmasi sudah diproses'
            using errcode = 'KW002';
    end if;

    -- Fetch the warga's user account scoped to this specific RT to avoid
    -- picking the wrong row when a warga belongs to multiple RTs.
    select * into v_warga
    from   user_membership
    where  warga_id = v_konfirmasi.warga_id
    and    rt_id    = v_konfirmasi.rt_id;

    -- 3. Duplicate month check
    if exists (
        select 1
        from   detail_pembayaran            dp
        join   detail_konfirmasi_pembayaran dkp on dkp.konfirmasi_id = p_konfirmasi_id
        where  dp.warga_id = v_konfirmasi.warga_id
        and    dp.tahun    = v_konfirmasi.tahun
        and    dp.bulan    = dkp.bulan
    ) then
        raise exception 'Beberapa bulan yang dikonfirmasi sudah memiliki data pembayaran yang disetujui'
            using errcode = 'KW003';
    end if;

    -- 4. Total validation
    select nominal_iuran into v_nominal_iuran from rt where id = v_konfirmasi.rt_id;

    select count(*) into v_jumlah_bulan
    from   detail_konfirmasi_pembayaran
    where  konfirmasi_id = p_konfirmasi_id;

    v_expected_total := v_nominal_iuran * v_jumlah_bulan;

    if v_konfirmasi.total_bayar > v_expected_total then
        raise exception 'Total pembayaran (%) melebihi jumlah yang seharusnya (% x % bulan = %). Selisih: %',
            v_konfirmasi.total_bayar, v_nominal_iuran, v_jumlah_bulan, v_expected_total,
            (v_konfirmasi.total_bayar - v_expected_total)
            using errcode = 'KW004';
    end if;

    if v_konfirmasi.total_bayar < v_expected_total then
        raise exception 'Total pembayaran (%) kurang dari jumlah yang seharusnya (% x % bulan = %). Selisih: %',
            v_konfirmasi.total_bayar, v_nominal_iuran, v_jumlah_bulan, v_expected_total,
            (v_expected_total - v_konfirmasi.total_bayar)
            using errcode = 'KW005';
    end if;

    -- 5. Insert pembayaran header
    insert into pembayaran (warga_id, rt_id, tahun, jumlah_bayar, tanggal, created_at)
    values (v_konfirmasi.warga_id, v_konfirmasi.rt_id, v_konfirmasi.tahun,
            v_konfirmasi.total_bayar, now(), now())
    returning id into v_pembayaran_id;

    -- 6. Copy monthly detail
    insert into detail_pembayaran (pembayaran_id, warga_id, tahun, bulan, nominal, created_at)
    select v_pembayaran_id, d.warga_id, d.tahun, d.bulan, d.nominal, now()
    from   detail_konfirmasi_pembayaran d
    where  d.konfirmasi_id = p_konfirmasi_id;

    -- 7. Mark approved
    update konfirmasi_pembayaran
    set    status      = 'approved',
           approved_at = now()
    where  id = p_konfirmasi_id;

    -- 8. Ledger entry
    perform insert_ledger(
        v_konfirmasi.rt_id,
        'pemasukan',
        'pembayaran',
        v_pembayaran_id,
        now(),
        'Pembayaran iuran warga',
        v_konfirmasi.total_bayar,
        p_user_id
    );

    -- 9. Notify warga
    select string_agg(v_bulan_names[bulan], ', ' order by bulan)
    into   v_bulan_str
    from   detail_konfirmasi_pembayaran
    where  konfirmasi_id = p_konfirmasi_id;

    insert into notifications (
        rt_id, type, title, message, entity_type, entity_id, target_user_id
    ) values (
        v_konfirmasi.rt_id,
        'payment_approved',
        'Pembayaran Disetujui',
        'Pembayaran iuran ' || v_bulan_str || ' ' || v_konfirmasi.tahun || ' telah disetujui',
        'konfirmasi_pembayaran',
        v_konfirmasi.id,
        v_warga.user_id
    );
end;
$$;


/* ----------------------------------------------------------------------------
 * Fix reject_konfirmasi: scoped membership lookup (same issue as above)
 * --------------------------------------------------------------------------- */

create or replace function reject_konfirmasi(
    p_konfirmasi_id uuid,
    p_alasan        text,
    p_user_id       uuid
)
returns void
language plpgsql
security definer
as $$
declare
    v_konfirmasi  record;
    v_warga       record;
    v_bulan_str   text;
    v_bulan_names text[] := array[
        'Januari', 'Februari', 'Maret',    'April',   'Mei',      'Juni',
        'Juli',    'Agustus',  'September', 'Oktober', 'November', 'Desember'
    ];
begin
    -- 1. Lock row
    select * into v_konfirmasi
    from   konfirmasi_pembayaran
    where  id = p_konfirmasi_id
    for update;

    if not found then
        raise exception 'Konfirmasi pembayaran tidak ditemukan'
            using errcode = 'KW001';
    end if;

    -- 2. Status check
    if v_konfirmasi.status != 'pending' then
        raise exception 'Konfirmasi sudah diproses'
            using errcode = 'KW002';
    end if;

    -- Fetch the warga's user account scoped to this RT.
    select * into v_warga
    from   user_membership
    where  warga_id = v_konfirmasi.warga_id
    and    rt_id    = v_konfirmasi.rt_id;

    -- 3. Mark rejected
    update konfirmasi_pembayaran
    set    status           = 'rejected',
           rejected_at      = now(),
           alasan_penolakan = p_alasan
    where  id = p_konfirmasi_id;

    -- 4. Notify warga
    select string_agg(v_bulan_names[bulan], ', ' order by bulan)
    into   v_bulan_str
    from   detail_konfirmasi_pembayaran
    where  konfirmasi_id = p_konfirmasi_id;

    insert into notifications (
        rt_id, type, title, message, entity_type, entity_id, target_user_id
    ) values (
        v_konfirmasi.rt_id,
        'payment_rejected',
        'Pembayaran Ditolak',
        'Pembayaran iuran ' || v_bulan_str || ' ' || v_konfirmasi.tahun || ' ditolak' ||
            case when p_alasan is not null and p_alasan != ''
                 then '. Alasan: ' || p_alasan
                 else ''
            end,
        'konfirmasi_pembayaran',
        v_konfirmasi.id,
        v_warga.user_id
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

-- user_membership: RLS helper functions scan by user_id
create index if not exists idx_user_membership_user_id
    on user_membership (user_id);

-- Core data tables: scanned by rt_id in RLS predicates
create index if not exists idx_warga_rt_id
    on warga (rt_id);

create index if not exists idx_konfirmasi_rt_id
    on konfirmasi_pembayaran (rt_id);

create index if not exists idx_pembayaran_rt_id
    on pembayaran (rt_id);

create index if not exists idx_pengeluaran_rt_id
    on pengeluaran (rt_id);

create index if not exists idx_activity_logs_rt_id
    on activity_logs (rt_id);

-- Detail tables: scanned by parent FK in RLS subquery
create index if not exists idx_detail_konfirmasi_konfirmasi_id
    on detail_konfirmasi_pembayaran (konfirmasi_id);

create index if not exists idx_detail_pembayaran_pembayaran_id
    on detail_pembayaran (pembayaran_id);
