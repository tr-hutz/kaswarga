/*
 * =============================================================================
 * 005_FUNCTIONS
 * All stored functions and triggers, ordered by dependency.
 * Depends on: 000_foundation, 001_financial, 002_communication, 003_registration
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * get_last_saldo
 * Returns the most recent ledger balance for an RT (0 if no entries yet).
 * --------------------------------------------------------------------------- */

create or replace function get_last_saldo(p_rt_id uuid)
returns bigint
language plpgsql
as $$
declare
    v_saldo bigint;
begin
    select saldo_setelah
    into   v_saldo
    from   ledger
    where  rt_id = p_rt_id
    order  by tanggal desc
    limit  1;

    return coalesce(v_saldo, 0);
end;
$$;


/* ----------------------------------------------------------------------------
 * insert_ledger
 * Appends a ledger entry with a running balance and returns the new row id.
 * --------------------------------------------------------------------------- */

create or replace function insert_ledger(
    p_rt_id        uuid,
    p_jenis        varchar,
    p_sumber       varchar,
    p_referensi_id uuid,
    p_tanggal      timestamptz,
    p_deskripsi    text,
    p_nominal      bigint,
    p_created_by   uuid
)
returns uuid
language plpgsql
as $$
declare
    v_last_saldo bigint;
    v_new_saldo  bigint;
    v_id         uuid;
begin
    v_last_saldo := get_last_saldo(p_rt_id);

    if p_jenis = 'pemasukan' then
        v_new_saldo := v_last_saldo + p_nominal;
    else
        v_new_saldo := v_last_saldo - p_nominal;
    end if;

    insert into ledger (
        rt_id,
        jenis,
        sumber,
        referensi_id,
        tanggal,
        deskripsi,
        nominal,
        saldo_setelah,
        created_by
    ) values (
        p_rt_id,
        p_jenis,
        p_sumber,
        p_referensi_id,
        p_tanggal,
        p_deskripsi,
        p_nominal,
        v_new_saldo,
        p_created_by
    )
    returning id into v_id;

    return v_id;
end;
$$;


/* ----------------------------------------------------------------------------
 * is_super_admin
 * Returns true when the currently authenticated user holds the super_admin role.
 *
 * SECURITY DEFINER is required here: querying user_membership from within its
 * own RLS policies would create a circular dependency. This function bypasses
 * RLS to perform the check safely.
 * --------------------------------------------------------------------------- */

create or replace function is_super_admin()
returns boolean
language sql
security definer
stable
as $$
    select exists (
        select 1
        from   user_membership
        where  user_id = auth.uid()
        and    role    = 'super_admin'
    )
$$;


/* ----------------------------------------------------------------------------
 * prevent_system_rt_delete
 * Trigger function that blocks deletion of the reserved System RT row.
 * --------------------------------------------------------------------------- */

create or replace function prevent_system_rt_delete()
returns trigger
language plpgsql
as $$
begin
    if old.id = '00000000-0000-0000-0000-000000000001' then
        raise exception 'System RT cannot be deleted'
            using errcode = 'KW010';
    end if;
    return old;
end;
$$;

create trigger trg_prevent_system_rt_delete
    before delete on rt
    for each row
    execute function prevent_system_rt_delete();


/* ----------------------------------------------------------------------------
 * set_updated_at
 * Generic trigger function that stamps updated_at on any table before update.
 * --------------------------------------------------------------------------- */

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger trg_registration_requests_updated_at
    before update on registration_requests
    for each row
    execute function set_updated_at();


/* ----------------------------------------------------------------------------
 * generate_rt_code
 * Returns the next available RT-XXXX code. Checks both the rt table and
 * pending registration_requests to avoid assigning the same code twice.
 * --------------------------------------------------------------------------- */

create or replace function generate_rt_code()
returns text
language plpgsql
security definer
as $$
declare
    next_num  integer;
    candidate text;
begin
    -- Highest numeric suffix currently in use in rt
    select coalesce(
        max(
            case
                when kode ~ '^RT-[0-9]{4}$'
                then substring(kode from 4)::integer
                else 0
            end
        ), 0
    ) + 1
    into next_num
    from rt
    where kode ~ '^RT-[0-9]{4}$';

    -- Also account for codes reserved by in-flight registration requests
    select greatest(
        next_num,
        coalesce(
            (
                select max(
                    case
                        when (rt_data->>'kode') ~ '^RT-[0-9]{4}$'
                        then substring(rt_data->>'kode' from 4)::integer
                        else 0
                    end
                )
                from registration_requests
                where type   = 'rt'
                and   status in ('pending', 'approved')
                and   rt_data is not null
            ), 0
        ) + 1
    )
    into next_num;

    candidate := 'RT-' || lpad(next_num::text, 4, '0');
    return candidate;
end;
$$;

grant execute on function generate_rt_code() to authenticated, anon;


/* ----------------------------------------------------------------------------
 * cleanup_expired_registrations
 * Marks pending requests whose expires_at has passed as 'expired'.
 * Intended to run nightly via pg_cron (see 009_seed.sql).
 * --------------------------------------------------------------------------- */

create or replace function cleanup_expired_registrations()
returns void
language plpgsql
security definer
as $$
begin
    update registration_requests
    set    status     = 'expired',
           updated_at = now()
    where  status     = 'pending'
    and    expires_at < now();
end;
$$;


/* ----------------------------------------------------------------------------
 * approve_konfirmasi
 *
 * Flow:
 *   1. Lock the konfirmasi row
 *   2. Validate status is still pending
 *   3. Validate no month in the request has already been paid
 *   4. Validate total matches expected amount
 *   5. Insert pembayaran header
 *   6. Copy monthly detail rows to detail_pembayaran
 *   7. Mark konfirmasi as approved
 *   8. Append a ledger entry
 *   9. Send in-app notification to warga
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

    select * into v_warga
    from   user_membership
    where  warga_id = v_konfirmasi.warga_id;

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
 * reject_konfirmasi
 *
 * Flow:
 *   1. Lock the konfirmasi row
 *   2. Validate status is still pending
 *   3. Mark as rejected with reason
 *   4. Send in-app notification to warga
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

    select * into v_warga
    from   user_membership
    where  warga_id = v_konfirmasi.warga_id;

    -- 2. Status check
    if not found then
        raise exception 'Konfirmasi pembayaran tidak ditemukan'
            using errcode = 'KW001';
    end if;

    if v_konfirmasi.status != 'pending' then
        raise exception 'Konfirmasi sudah diproses'
            using errcode = 'KW002';
    end if;

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
 * populate_cashflow  — development / seeding utility
 * Generates synthetic pembayaran and pengeluaran records for testing.
 * Restricted to service_role so it cannot be called from the browser client.
 * --------------------------------------------------------------------------- */

create or replace function populate_cashflow(
    p_tahun             int,
    p_jumlah_data       int     default 100,
    p_max_bulan         int     default 3,
    p_rasio_pengeluaran numeric default 0.8
)
returns void
language plpgsql
as $$
declare
    v_warga_id            uuid;
    v_pembayaran_id       uuid;
    v_jumlah_bulan        int;
    v_rt                  record;
    v_jumlah_bayar        bigint;
    v_total_masuk         bigint  := 0;
    v_target_pengeluaran  bigint;
    v_current_pengeluaran bigint  := 0;
    v_kategori            text[]  := array['sosial', 'operasional', 'kebersihan', 'keamanan', 'kegiatan'];
    v_deskripsi           text[]  := array[
        'Bantuan warga sakit', 'Pembelian alat kebersihan',
        'Konsumsi rapat',      'Perbaikan fasilitas',       'Honor keamanan'
    ];
    v_bulan               int;
    v_selected_bulan      int[]   := '{}';
    v_random_bulan        int;
    v_tanggal             timestamp;
begin
    select id, nominal_iuran into v_rt from rt limit 1;

    if v_rt.nominal_iuran is null then
        raise exception 'Nominal iuran pada RT belum diatur';
    end if;

    -- Clear existing data for the year
    delete from detail_pembayaran where tahun = p_tahun;
    delete from pembayaran         where tahun = p_tahun;
    delete from pengeluaran        where extract(year from tanggal) = p_tahun;

    -- Generate payments
    for i in 1..p_jumlah_data loop
        select id into v_warga_id from warga order by random() limit 1;

        v_jumlah_bulan   := floor(random() * p_max_bulan + 1);
        v_selected_bulan := '{}';

        while array_length(v_selected_bulan, 1) is null
           or array_length(v_selected_bulan, 1) < v_jumlah_bulan loop

            v_random_bulan := floor(random() * 12 + 1);

            if not (v_random_bulan = any(v_selected_bulan)) then
                if not exists (
                    select 1 from detail_pembayaran
                    where  warga_id = v_warga_id
                    and    tahun    = p_tahun
                    and    bulan    = v_random_bulan
                ) then
                    v_selected_bulan := array_append(v_selected_bulan, v_random_bulan);
                end if;
            end if;
        end loop;

        v_jumlah_bayar := v_jumlah_bulan * v_rt.nominal_iuran;
        v_tanggal      := now() - (floor(random() * 120) || ' days')::interval;

        insert into pembayaran (warga_id, rt_id, tahun, jumlah_bayar, tanggal, created_at)
        values (v_warga_id, v_rt.id, p_tahun, v_jumlah_bayar, v_tanggal, now())
        returning id into v_pembayaran_id;

        foreach v_bulan in array v_selected_bulan loop
            insert into detail_pembayaran (pembayaran_id, warga_id, tahun, bulan, nominal, created_at)
            values (v_pembayaran_id, v_warga_id, p_tahun, v_bulan, v_rt.nominal_iuran, now());
        end loop;

        v_total_masuk := v_total_masuk + v_jumlah_bayar;
    end loop;

    -- Generate expenses proportional to total income
    v_target_pengeluaran := (v_total_masuk * p_rasio_pengeluaran)::bigint;

    while v_current_pengeluaran < v_target_pengeluaran loop
        v_jumlah_bayar := (floor(random() * 5) + 1) * v_rt.nominal_iuran;

        exit when (v_current_pengeluaran + v_jumlah_bayar) > v_target_pengeluaran;

        insert into pengeluaran (rt_id, kategori, deskripsi, nominal, tanggal, created_at)
        values (
            v_rt.id,
            v_kategori[floor(random() * 5) + 1],
            v_deskripsi[floor(random() * 5) + 1],
            v_jumlah_bayar,
            now() - (floor(random() * 120) || ' days')::interval,
            now()
        );

        v_current_pengeluaran := v_current_pengeluaran + v_jumlah_bayar;
    end loop;
end;
$$;

-- Utility functions: restrict access to safe roles
revoke all     on function populate_cashflow(int, int, int, numeric)                                       from public;
revoke all     on function insert_ledger(uuid, varchar, varchar, uuid, timestamptz, text, bigint, uuid)    from public;
revoke all     on function get_last_saldo(uuid)                                                            from public;

grant  execute on function populate_cashflow(int, int, int, numeric)                                       to service_role;
grant  execute on function insert_ledger(uuid, varchar, varchar, uuid, timestamptz, text, bigint, uuid)    to service_role;
grant  execute on function get_last_saldo(uuid)                                                            to authenticated;


/* ----------------------------------------------------------------------------
 * approve_pengeluaran
 *
 * Flow:
 *   1. Lock the pengeluaran row
 *   2. Validate status is still pending
 *   3. Mark as approved with timestamp and approver
 *   4. Append a ledger debit entry
 *   5. Notify the expense creator
 * --------------------------------------------------------------------------- */

create or replace function approve_pengeluaran(
    p_id      uuid,
    p_user_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
    v_row record;
begin
    -- 1. Lock row
    select * into v_row
    from   pengeluaran
    where  id = p_id
    for update;

    if not found then
        raise exception 'Pengeluaran tidak ditemukan'
            using errcode = 'KW020';
    end if;

    -- 2. Status check
    if v_row.status != 'pending' then
        raise exception 'Pengeluaran sudah diproses'
            using errcode = 'KW021';
    end if;

    -- 3. Mark approved
    update pengeluaran
    set    status      = 'approved',
           approved_by = p_user_id,
           approved_at = now()
    where  id = p_id;

    -- 4. Ledger debit entry
    perform insert_ledger(
        v_row.rt_id,
        'pengeluaran',
        'pengeluaran',
        p_id,
        now(),
        coalesce(v_row.deskripsi, 'Pengeluaran RT'),
        v_row.nominal::bigint,
        p_user_id
    );

    -- 5. Notify creator
    if v_row.created_by is not null then
        insert into notifications (
            rt_id, type, title, message, entity_type, entity_id, target_user_id
        ) values (
            v_row.rt_id,
            'expense_approved',
            'Pengeluaran Disetujui',
            'Pengeluaran ' || coalesce(v_row.nomor_bukti, '') || ' telah disetujui',
            'pengeluaran',
            p_id,
            v_row.created_by
        );
    end if;
end;
$$;


/* ----------------------------------------------------------------------------
 * reject_pengeluaran
 *
 * Flow:
 *   1. Lock the pengeluaran row
 *   2. Validate status is still pending
 *   3. Mark as rejected with reason
 *   4. Notify the expense creator
 * --------------------------------------------------------------------------- */

create or replace function reject_pengeluaran(
    p_id      uuid,
    p_alasan  text,
    p_user_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
    v_row record;
begin
    -- 1. Lock row
    select * into v_row
    from   pengeluaran
    where  id = p_id
    for update;

    if not found then
        raise exception 'Pengeluaran tidak ditemukan'
            using errcode = 'KW020';
    end if;

    -- 2. Status check
    if v_row.status != 'pending' then
        raise exception 'Pengeluaran sudah diproses'
            using errcode = 'KW021';
    end if;

    -- 3. Mark rejected
    update pengeluaran
    set    status             = 'rejected',
           approved_by        = p_user_id,
           catatan_penolakan  = p_alasan
    where  id = p_id;

    -- 4. Notify creator
    if v_row.created_by is not null then
        insert into notifications (
            rt_id, type, title, message, entity_type, entity_id, target_user_id
        ) values (
            v_row.rt_id,
            'expense_rejected',
            'Pengeluaran Ditolak',
            'Pengeluaran ' || coalesce(v_row.nomor_bukti, '') || ' ditolak' ||
                case when p_alasan is not null and p_alasan != ''
                     then '. Alasan: ' || p_alasan
                     else ''
                end,
            'pengeluaran',
            p_id,
            v_row.created_by
        );
    end if;
end;
$$;

revoke all     on function approve_pengeluaran(uuid, uuid)       from public;
revoke all     on function reject_pengeluaran(uuid, text, uuid)  from public;
grant  execute on function approve_pengeluaran(uuid, uuid)       to authenticated;
grant  execute on function reject_pengeluaran(uuid, text, uuid)  to authenticated;


/* ----------------------------------------------------------------------------
 * approve_all_pending_pengeluaran
 *
 * Approves every pending pengeluaran for the given RT atomically.
 * Returns the count of rows approved.
 * --------------------------------------------------------------------------- */

create or replace function approve_all_pending_pengeluaran(
    p_rt_id   uuid,
    p_user_id uuid
)
returns integer
language plpgsql
security definer
as $$
declare
    v_row   record;
    v_count integer := 0;
begin
    for v_row in
        select *
        from   pengeluaran
        where  rt_id  = p_rt_id
        and    status = 'pending'
        and    aktif  = true
        for update skip locked
    loop
        update pengeluaran
        set    status      = 'approved',
               approved_by = p_user_id,
               approved_at = now()
        where  id = v_row.id;

        perform insert_ledger(
            v_row.rt_id,
            'pengeluaran',
            'pengeluaran',
            v_row.id,
            coalesce(v_row.tanggal::timestamptz, now()),
            coalesce(v_row.deskripsi, v_row.kategori, 'Pengeluaran'),
            v_row.nominal::bigint,
            p_user_id
        );

        if v_row.created_by is not null then
            insert into notifications (
                rt_id, type, title, message, entity_type, entity_id, target_user_id
            ) values (
                v_row.rt_id,
                'expense_approved',
                'Pengeluaran Disetujui',
                'Pengeluaran ' || coalesce(v_row.nomor_bukti, '') ||
                    ' sebesar Rp ' || v_row.nominal || ' telah disetujui.',
                'pengeluaran',
                v_row.id,
                v_row.created_by
            );
        end if;

        v_count := v_count + 1;
    end loop;

    return v_count;
end;
$$;

revoke all     on function approve_all_pending_pengeluaran(uuid, uuid) from public;
grant  execute on function approve_all_pending_pengeluaran(uuid, uuid) to authenticated;
