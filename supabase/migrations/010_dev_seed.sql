/*
 * =============================================================================
 * 010_DEV_SEED
 * Development / QA seeding utilities.
 * Supersedes: populate_cashflow() in 005_functions.sql
 * Depends on: 000–009
 * =============================================================================
 *
 * Functions
 * ---------
 *   rollback_dev_data(p_rt_id)   — wipe all financial/comm data for an RT
 *   seed_dev_data(...)           — populate an RT with realistic sample data
 *
 * Quick start (run as service_role or postgres)
 * ---------------------------------------------
 *   -- Populate RT 01 with defaults (2025, 40 payments, 10 confirmations, 24 expenses)
 *   select seed_dev_data();
 *
 *   -- Custom amounts
 *   select seed_dev_data(
 *       p_jumlah_pembayaran  := 20,
 *       p_jumlah_konfirmasi  := 6,
 *       p_jumlah_pengeluaran := 12
 *   );
 *
 *   -- Specific RT and year
 *   select seed_dev_data('22222222-2222-2222-2222-222222222222', 2024);
 *
 *   -- Wipe everything and start over
 *   select rollback_dev_data();
 *
 *   -- Wipe one RT only
 *   select rollback_dev_data('11111111-1111-1111-1111-111111111111');
 * =============================================================================
 */


/* ---------------------------------------------------------------------------
 * rollback_dev_data
 *
 * Removes all financial and communication data for one RT (or every non-system
 * RT when called with no argument).
 *
 * Tables cleared  : notifications, activity_logs, ledger, expenses,
 *                   payments (→ payment_details via cascade),
 *                   payment_confirmations (→ confirmation_details via cascade)
 * Tables preserved: rt, residents, users, memberships, registration_requests
 * --------------------------------------------------------------------------- */

create or replace function rollback_dev_data(p_rt_id uuid default null)
returns void
language plpgsql
security definer
as $$
declare
    v_sys constant uuid := '00000000-0000-0000-0000-000000000001';
begin
    if p_rt_id is not null and p_rt_id = v_sys then
        raise exception 'rollback_dev_data: cannot target the System RT';
    end if;

    if p_rt_id is not null then
        delete from notifications         where rt_id = p_rt_id;
        delete from activity_logs         where rt_id = p_rt_id;
        delete from ledger                where rt_id = p_rt_id;
        delete from expenses              where rt_id = p_rt_id;
        delete from payments              where rt_id = p_rt_id;  -- cascades → payment_details
        delete from payment_confirmations where rt_id = p_rt_id;  -- cascades → confirmation_details
    else
        delete from notifications         where rt_id != v_sys;
        delete from activity_logs         where rt_id != v_sys;
        delete from ledger                where rt_id != v_sys;
        delete from expenses              where rt_id != v_sys;
        delete from payments              where rt_id != v_sys;
        delete from payment_confirmations where rt_id != v_sys;
    end if;
end;
$$;


/* ---------------------------------------------------------------------------
 * seed_dev_data
 *
 * Generates near-realistic sample data for one RT and year:
 *
 *   Approved flow  payment_confirmations (approved)
 *                  → confirmation_details
 *                  → payments + payment_details
 *                  → ledger entry  (pemasukan)
 *                  → notification  (payment_approved → resident)
 *                  → activity_log  (pembayaran_disetujui)
 *
 *   Pending        payment_confirmations (pending, recent months Oct–Dec)
 *                  → confirmation_details
 *                  → notification  (new_konfirmasi → admin role)
 *                  → activity_log  (CREATE_PAYMENT)
 *
 *   Rejected       payment_confirmations (rejected, mid-year months Apr–Jul)
 *                  → confirmation_details
 *                  → notification  (payment_rejected → resident)
 *                  → activity_log  (pembayaran_ditolak)
 *
 *   Expenses       expenses record (spread across the year)
 *                  → ledger entry  (pengeluaran)
 *                  → activity_log  (pengeluaran_dicatat)
 *
 * Parameters
 * ----------
 *   p_rt_id              RT to populate; null = first non-system RT
 *   p_tahun              Year to generate data for (default 2025)
 *   p_jumlah_pembayaran  Max total approved-payment records (default 40)
 *   p_jumlah_konfirmasi  Total pending + rejected confirmations (default 10)
 *   p_jumlah_pengeluaran Total expense records (default 24)
 *
 * Resident payment profiles (cyclic by position index % 4)
 * --------------------------------------------------------
 *   0 rajin  — pays months 1-12, 1 month per confirmation
 *   1 normal — pays months 1-9,  1-2 months per confirmation
 *   2 cukup  — pays months 1-6,  2-3 months per confirmation
 *   3 malas  — pays months 1-3,  3 months per confirmation
 *
 * Constraint safety
 * -----------------
 * confirmation_details: no UNIQUE constraint (dropped in 011).
 * payment_details:      has UNIQUE (resident_id, year, month).
 * The function queries existing used months before each insert and skips any
 * month already occupied, regardless of the parent confirmation status.
 *
 * Returns a human-readable summary string.
 * --------------------------------------------------------------------------- */

create or replace function seed_dev_data(
    p_rt_id              uuid  default null,
    p_tahun              int   default 2025,
    p_jumlah_pembayaran  int   default 40,
    p_jumlah_konfirmasi  int   default 10,
    p_jumlah_pengeluaran int   default 24
)
returns text
language plpgsql
security definer
as $$
declare
    v_rt             record;
    v_warga_rec      record;
    v_warga_idx      int     := 0;
    v_actor_id       uuid;
    v_actor_name     text;
    v_nominal_iuran  bigint;
    v_target_uid     uuid;

    v_bulan_names    text[]  := array[
        'Januari','Februari','Maret','April','Mei','Juni',
        'Juli','Agustus','September','Oktober','November','Desember'
    ];

    v_used_months    int[]   := '{}';
    v_konfirmasi_id  uuid;
    v_pembayaran_id  uuid;
    v_pengeluaran_id uuid;
    v_bulan_arr      int[];
    v_bulan          int;
    v_bulan_str      text;
    v_nominal        bigint;
    v_tanggal        timestamptz;
    v_profile        int;
    v_months_limit   int;
    v_batch_size     int;
    v_cur_bulan      int;
    v_avail_month    int;
    m                int;

    v_cnt_approved   int     := 0;
    v_cnt_pending    int     := 0;
    v_cnt_rejected   int     := 0;
    v_cnt_expense    int     := 0;
    v_total_masuk    bigint  := 0;
    v_total_keluar   bigint  := 0;
    v_pending_target int;
    v_rejected_target int;

    -- Expense category data (index 1–5)
    v_kat_name text[]   := array['Keamanan', 'Kebersihan', 'Perawatan Lingkungan', 'Administrasi', 'Operasional Pengurus'];
    v_kat_min  int[]    := array[1, 4, 2, 3, 10];   -- × nominal_iuran, lower bound
    v_kat_max  int[]    := array[3, 8, 5, 8, 20];   -- × nominal_iuran, upper bound
    v_kat_desc text[]   := array[
        'Pembelian alat kebersihan lingkungan',
        'Honor keamanan dan jaga malam',
        'Biaya operasional sekretariat',
        'Bantuan sosial warga',
        'Konsumsi kegiatan warga'
    ];
    v_kat_idx  int;
    v_exp_bulan int;
    v_exp_nom  bigint;

    v_alasan_list text[] := array[
        'Bukti transfer tidak jelas',
        'Nominal tidak sesuai dengan iuran',
        'Gambar bukti tidak dapat dibaca'
    ];
    v_metode_list text[] := array['transfer','qris','tunai'];
begin
    /* ---------------------------------------------------------------------- */
    /* 1. Resolve RT                                                           */
    /* ---------------------------------------------------------------------- */
    if p_rt_id is null then
        select id into p_rt_id
        from   rt
        where  id != '00000000-0000-0000-0000-000000000001'
        order  by created_at, id
        limit  1;
    end if;

    select * into v_rt from rt where id = p_rt_id;
    if not found then
        raise exception 'seed_dev_data: RT not found: %', p_rt_id;
    end if;
    if v_rt.monthly_fee = 0 then
        raise exception 'seed_dev_data: RT % has monthly_fee = 0 — set it first', v_rt.name;
    end if;
    v_nominal_iuran := v_rt.monthly_fee;

    /* ---------------------------------------------------------------------- */
    /* 2. Resolve actor (prefers CHAIR > ADMIN > TREASURER > any user)        */
    /* ---------------------------------------------------------------------- */
    select um.user_id, u.name
    into   v_actor_id, v_actor_name
    from   memberships um
    join   users u on u.id = um.user_id
    where  um.rt_id = p_rt_id
    order  by case um.role
                  when 'CHAIR'     then 1
                  when 'ADMIN'     then 2
                  when 'TREASURER' then 3
                  else 4
              end
    limit  1;

    /* ---------------------------------------------------------------------- */
    /* 3. Clean slate                                                          */
    /* ---------------------------------------------------------------------- */
    perform rollback_dev_data(p_rt_id);

    /* ---------------------------------------------------------------------- */
    /* 4. Phase A — Approved payments                                         */
    /*                                                                         */
    /* Each resident gets a cyclical payment profile that controls how many   */
    /* months they pay and how those months are batched into confirmations.   */
    /* The outer loop stops once p_jumlah_pembayaran records are created.     */
    /* ---------------------------------------------------------------------- */
    for v_warga_rec in
        select id, name
        from   residents
        where  rt_id = p_rt_id and active = true
        order  by id
    loop
        exit when v_cnt_approved >= p_jumlah_pembayaran;

        v_profile     := v_warga_idx % 4;
        v_warga_idx   := v_warga_idx + 1;
        v_used_months := '{}';

        case v_profile
            when 0 then v_months_limit := 12;   -- rajin: full year
            when 1 then v_months_limit :=  9;   -- normal: 9 months
            when 2 then v_months_limit :=  6;   -- cukup: 6 months
            else        v_months_limit :=  3;   -- malas: 3 months
        end case;

        select um.user_id into v_target_uid
        from   memberships um
        where  um.resident_id = v_warga_rec.id
        limit  1;

        v_cur_bulan := 1;

        while v_cur_bulan <= v_months_limit and v_cnt_approved < p_jumlah_pembayaran loop
            -- Batch size per profile
            case v_profile
                when 0 then v_batch_size := 1;
                when 1 then v_batch_size := 1 + (floor(random() * 2))::int;   -- 1–2
                when 2 then v_batch_size := 2 + (floor(random() * 2))::int;   -- 2–3
                else        v_batch_size := 3;
            end case;
            -- Cap to remaining months in this profile window
            v_batch_size := least(v_batch_size, v_months_limit - v_cur_bulan + 1);

            -- Build ordered month array for the batch
            v_bulan_arr := '{}';
            for i in 0..(v_batch_size - 1) loop
                v_bulan_arr := array_append(v_bulan_arr, v_cur_bulan + i);
            end loop;

            v_nominal := v_batch_size * v_nominal_iuran;

            -- Submission date: within the last month of the batch, days 5–25
            v_tanggal := (
                make_date(p_tahun, v_cur_bulan + v_batch_size - 1, 5)
                + ((floor(random() * 20))::int || ' days')::interval
                + ((floor(random() * 10) + 8)::int || ' hours')::interval
            )::timestamptz;

            v_bulan_str := array_to_string(
                array(select v_bulan_names[b] from unnest(v_bulan_arr) as b order by b),
                ', '
            );

            -- payment_confirmations (approved)
            insert into payment_confirmations (
                resident_id, rt_id, year, total_amount,
                status, approved_at, created_at
            ) values (
                v_warga_rec.id, p_rt_id, p_tahun, v_nominal,
                'approved', v_tanggal + interval '4 hours', v_tanggal
            ) returning id into v_konfirmasi_id;

            -- confirmation_details
            foreach v_bulan in array v_bulan_arr loop
                insert into confirmation_details (
                    confirmation_id, resident_id, year, month, amount, created_at
                ) values (
                    v_konfirmasi_id, v_warga_rec.id, p_tahun, v_bulan,
                    v_nominal_iuran, v_tanggal
                );
                v_used_months := array_append(v_used_months, v_bulan);
            end loop;

            -- payments
            insert into payments (
                resident_id, rt_id, year, total_amount, date,
                method, notes, created_at
            ) values (
                v_warga_rec.id, p_rt_id, p_tahun, v_nominal,
                v_tanggal + interval '4 hours',
                v_metode_list[(floor(random() * 3) + 1)::int],
                'Iuran ' || v_bulan_str || ' ' || p_tahun,
                v_tanggal + interval '4 hours'
            ) returning id into v_pembayaran_id;

            -- payment_details
            foreach v_bulan in array v_bulan_arr loop
                insert into payment_details (
                    payment_id, resident_id, year, month, amount, created_at
                ) values (
                    v_pembayaran_id, v_warga_rec.id, p_tahun, v_bulan,
                    v_nominal_iuran, v_tanggal + interval '4 hours'
                );
            end loop;

            -- Ledger: pemasukan
            perform insert_ledger(
                p_rt_id, 'pemasukan', 'pembayaran', v_pembayaran_id,
                v_tanggal + interval '4 hours',
                'Iuran ' || v_warga_rec.name || ' — ' || v_bulan_str || ' ' || p_tahun,
                v_nominal,
                v_actor_id
            );
            v_total_masuk := v_total_masuk + v_nominal;

            -- Notification to resident
            if v_target_uid is not null then
                insert into notifications (
                    rt_id, type, title, message,
                    entity_type, entity_id, target_user_id,
                    is_read, created_at
                ) values (
                    p_rt_id, 'payment_approved', 'Pembayaran Disetujui',
                    'Iuran ' || v_bulan_str || ' ' || p_tahun || ' telah disetujui',
                    'payment_confirmations', v_konfirmasi_id, v_target_uid,
                    (random() > 0.4),
                    v_tanggal + interval '4 hours'
                );
            end if;

            -- Activity log
            insert into activity_logs (
                rt_id, actor_id, actor_name, action,
                entity_type, entity_id, description, visibility, created_at
            ) values (
                p_rt_id, v_actor_id, v_actor_name,
                'pembayaran_disetujui', 'payment_confirmations', v_konfirmasi_id,
                'Iuran ' || v_warga_rec.name || ' (' || v_bulan_str || ') disetujui',
                'internal', v_tanggal + interval '4 hours'
            );

            v_cnt_approved := v_cnt_approved + 1;
            v_cur_bulan    := v_cur_bulan + v_batch_size;
        end loop;
    end loop;

    /* ---------------------------------------------------------------------- */
    /* 5. Phase B — Pending confirmations (recent months: Oct–Dec)            */
    /*                                                                         */
    /* Simulates residents who recently submitted but haven't been reviewed.  */
    /* 70 % of p_jumlah_konfirmasi goes to pending, 30 % to rejected.        */
    /* ---------------------------------------------------------------------- */
    v_pending_target  := (p_jumlah_konfirmasi * 0.7)::int;
    v_rejected_target := p_jumlah_konfirmasi - v_pending_target;

    for v_warga_rec in
        select id, name
        from   residents
        where  rt_id = p_rt_id and active = true
        order  by id
    loop
        exit when v_cnt_pending >= v_pending_target;

        -- Reload months used by this resident (includes Phase A inserts)
        select coalesce(array_agg(month), '{}') into v_used_months
        from   confirmation_details
        where  resident_id = v_warga_rec.id and year = p_tahun;

        -- Find first free month scanning Dec → Oct
        v_avail_month := null;
        m := 12;
        while m >= 10 loop
            if not (m = any(v_used_months)) then
                v_avail_month := m;
                exit;
            end if;
            m := m - 1;
        end loop;

        continue when v_avail_month is null;

        select um.user_id into v_target_uid
        from   memberships um
        where  um.resident_id = v_warga_rec.id limit 1;

        v_tanggal := (
            make_date(p_tahun, v_avail_month, 1)
            + ((floor(random() * 20))::int || ' days')::interval
            + ((floor(random() * 10) + 8)::int || ' hours')::interval
        )::timestamptz;

        insert into payment_confirmations (
            resident_id, rt_id, year, total_amount, status, created_at
        ) values (
            v_warga_rec.id, p_rt_id, p_tahun, v_nominal_iuran, 'pending', v_tanggal
        ) returning id into v_konfirmasi_id;

        insert into confirmation_details (
            confirmation_id, resident_id, year, month, amount, created_at
        ) values (
            v_konfirmasi_id, v_warga_rec.id, p_tahun, v_avail_month, v_nominal_iuran, v_tanggal
        );

        -- Notify admin role of new submission
        insert into notifications (
            rt_id, type, title, message,
            entity_type, entity_id, target_role,
            is_read, created_at
        ) values (
            p_rt_id, 'new_konfirmasi', 'Konfirmasi Pembayaran Baru',
            v_warga_rec.name || ' mengajukan iuran '
                || v_bulan_names[v_avail_month] || ' ' || p_tahun,
            'payment_confirmations', v_konfirmasi_id, 'ADMIN',
            false, v_tanggal
        );

        insert into activity_logs (
            rt_id, actor_id, actor_name, action,
            entity_type, entity_id, description, visibility, created_at
        ) values (
            p_rt_id, v_target_uid, v_warga_rec.name,
            'CREATE_PAYMENT', 'payment_confirmations', v_konfirmasi_id,
            v_warga_rec.name || ' mengajukan konfirmasi iuran '
                || v_bulan_names[v_avail_month],
            'public', v_tanggal
        );

        v_cnt_pending := v_cnt_pending + 1;
    end loop;

    /* ---------------------------------------------------------------------- */
    /* 6. Phase C — Rejected confirmations (mid-year: Apr–Jul)                */
    /*                                                                         */
    /* Simulates residents who uploaded unclear proof and got rejected.       */
    /* ---------------------------------------------------------------------- */
    for v_warga_rec in
        select id, name
        from   residents
        where  rt_id = p_rt_id and active = true
        order  by id
    loop
        exit when v_cnt_rejected >= v_rejected_target;

        select coalesce(array_agg(month), '{}') into v_used_months
        from   confirmation_details
        where  resident_id = v_warga_rec.id and year = p_tahun;

        -- Find first free month scanning Apr → Jul
        v_avail_month := null;
        m := 4;
        while m <= 7 loop
            if not (m = any(v_used_months)) then
                v_avail_month := m;
                exit;
            end if;
            m := m + 1;
        end loop;

        continue when v_avail_month is null;

        select um.user_id into v_target_uid
        from   memberships um
        where  um.resident_id = v_warga_rec.id limit 1;

        -- Fixed submission date (5th of the month, 10:00)
        v_tanggal := make_timestamptz(p_tahun, v_avail_month, 5, 10, 0, 0);

        insert into payment_confirmations (
            resident_id, rt_id, year, total_amount,
            status, rejected_at, rejection_reason, created_at
        ) values (
            v_warga_rec.id, p_rt_id, p_tahun, v_nominal_iuran,
            'rejected',
            v_tanggal + interval '1 day',
            v_alasan_list[(floor(random() * 3) + 1)::int],
            v_tanggal
        ) returning id into v_konfirmasi_id;

        insert into confirmation_details (
            confirmation_id, resident_id, year, month, amount, created_at
        ) values (
            v_konfirmasi_id, v_warga_rec.id, p_tahun, v_avail_month, v_nominal_iuran, v_tanggal
        );

        -- Notify resident of rejection (mark as already-read, it's mid-year)
        if v_target_uid is not null then
            insert into notifications (
                rt_id, type, title, message,
                entity_type, entity_id, target_user_id,
                is_read, created_at
            ) values (
                p_rt_id, 'payment_rejected', 'Pembayaran Ditolak',
                'Konfirmasi iuran ' || v_bulan_names[v_avail_month]
                    || ' ' || p_tahun || ' ditolak',
                'payment_confirmations', v_konfirmasi_id, v_target_uid,
                true, v_tanggal + interval '1 day'
            );
        end if;

        insert into activity_logs (
            rt_id, actor_id, actor_name, action,
            entity_type, entity_id, description, visibility, created_at
        ) values (
            p_rt_id, v_actor_id, v_actor_name,
            'pembayaran_ditolak', 'payment_confirmations', v_konfirmasi_id,
            'Konfirmasi ' || v_warga_rec.name || ' ditolak: bukti tidak valid',
            'internal', v_tanggal + interval '1 day'
        );

        v_cnt_rejected := v_cnt_rejected + 1;
    end loop;

    /* ---------------------------------------------------------------------- */
    /* 7. Phase D — Expenses (spread evenly across the year)                  */
    /*                                                                         */
    /* Categories cycle: kebersihan → keamanan → operasional → sosial →      */
    /* kegiatan → repeat.  Amount = random multiplier × monthly_fee.         */
    /* ---------------------------------------------------------------------- */
    for i in 1..p_jumlah_pengeluaran loop
        v_kat_idx   := ((i - 1) % 5) + 1;
        v_exp_bulan := ((i - 1) % 12) + 1;

        v_exp_nom := (
            v_kat_min[v_kat_idx]
            + (floor(random() * (v_kat_max[v_kat_idx] - v_kat_min[v_kat_idx] + 1)))::int
        ) * v_nominal_iuran;

        v_tanggal := (
            make_date(p_tahun, v_exp_bulan, 10)
            + ((floor(random() * 15))::int || ' days')::interval
            + ((floor(random() * 8) + 8)::int || ' hours')::interval
        )::timestamptz;

        insert into expenses (
            rt_id, date, category, amount, description, active, created_at
        ) values (
            p_rt_id,
            v_tanggal::date,
            v_kat_name[v_kat_idx],
            v_exp_nom,
            v_kat_desc[v_kat_idx],
            true,
            v_tanggal
        ) returning id into v_pengeluaran_id;

        perform insert_ledger(
            p_rt_id, 'pengeluaran', 'pengeluaran', v_pengeluaran_id,
            v_tanggal,
            v_kat_name[v_kat_idx] || ': ' || v_kat_desc[v_kat_idx],
            v_exp_nom,
            v_actor_id
        );
        v_total_keluar := v_total_keluar + v_exp_nom;

        insert into activity_logs (
            rt_id, actor_id, actor_name, action,
            entity_type, entity_id, description, visibility, created_at
        ) values (
            p_rt_id, v_actor_id, v_actor_name,
            'pengeluaran_dicatat', 'expenses', v_pengeluaran_id,
            v_kat_name[v_kat_idx] || ': ' || v_kat_desc[v_kat_idx]
                || ' (Rp' || to_char(v_exp_nom, 'FM999,999,999') || ')',
            'internal', v_tanggal
        );

        v_cnt_expense := v_cnt_expense + 1;
    end loop;

    /* ---------------------------------------------------------------------- */
    /* 8. Summary                                                              */
    /* ---------------------------------------------------------------------- */
    return format(
        E'Selesai untuk %s (%s), tahun %s\n'
        || '  Pembayaran disetujui : %s konfirmasi\n'
        || '  Konfirmasi pending   : %s\n'
        || '  Konfirmasi ditolak   : %s\n'
        || '  Pengeluaran          : %s\n'
        || '  Total pemasukan      : Rp%s\n'
        || '  Total pengeluaran    : Rp%s\n'
        || '  Saldo akhir          : Rp%s',
        v_rt.name, v_rt.code, p_tahun,
        v_cnt_approved, v_cnt_pending, v_cnt_rejected, v_cnt_expense,
        to_char(v_total_masuk,                  'FM999,999,999'),
        to_char(v_total_keluar,                 'FM999,999,999'),
        to_char(v_total_masuk - v_total_keluar, 'FM999,999,999')
    );
end;
$$;


revoke all     on function rollback_dev_data(uuid)                      from public;
revoke all     on function seed_dev_data(uuid, int, int, int, int)      from public;
grant  execute on function rollback_dev_data(uuid)                      to service_role;
grant  execute on function seed_dev_data(uuid, int, int, int, int)      to service_role;
