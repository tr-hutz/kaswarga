/*
 * =============================================================================
 * 012_RENAME_TO_ENGLISH
 *
 * Renames all tables, columns, and enum values from Indonesian to English,
 * aligning the database schema with the GLOSSARY.md naming standard.
 *
 * Sections:
 *   1. Enum value renames
 *   2. Table renames
 *   3. Column renames (per table)
 *   4. Recreate all stored functions (bodies reference old column/table names)
 *   5. Update RLS policies that embed enum literal values
 *
 * Notes:
 *   - ALTER TABLE RENAME and ALTER TABLE RENAME COLUMN are metadata-only
 *     operations; foreign keys, indexes, and triggers follow automatically.
 *   - RLS policy USING clauses that reference only column names are unaffected
 *     (PostgreSQL stores the parse tree with OID references, not name strings).
 *   - Policies that embed role literal strings ('ketua', 'admin') must be
 *     dropped and recreated after the enum rename.
 *
 * Depends on: 000–011
 * =============================================================================
 */


/* ============================================================================
 * 1. ENUM VALUE RENAMES  (user_role)
 * ========================================================================= */

alter type user_role rename value 'super_admin' to 'SUPER_ADMIN';
alter type user_role rename value 'ketua'       to 'CHAIR';
alter type user_role rename value 'admin'       to 'ADMIN';
alter type user_role rename value 'bendahara'   to 'TREASURER';
alter type user_role rename value 'warga'       to 'RESIDENT';


/* ============================================================================
 * 2. TABLE RENAMES
 * ========================================================================= */

alter table warga                        rename to residents;
alter table user_membership              rename to memberships;
alter table konfirmasi_pembayaran        rename to payment_confirmations;
alter table detail_konfirmasi_pembayaran rename to confirmation_details;
alter table pembayaran                   rename to payments;
alter table detail_pembayaran            rename to payment_details;
alter table pengeluaran_kategori         rename to expense_categories;
alter table pengeluaran                  rename to expenses;


/* ============================================================================
 * 3. COLUMN RENAMES
 * ========================================================================= */

/* rt -------------------------------------------------------------------- */
alter table rt rename column nama           to name;
alter table rt rename column kode           to code;
alter table rt rename column alamat         to address;
alter table rt rename column kota           to city;
alter table rt rename column provinsi       to province;
alter table rt rename column kode_pos       to postal_code;
alter table rt rename column telepon        to phone;
alter table rt rename column nominal_iuran  to monthly_fee;
alter table rt rename column nama_bank      to bank_name;
alter table rt rename column nomor_rekening to account_number;
alter table rt rename column atas_nama      to account_holder;
alter table rt rename column aktif          to active;

/* users ------------------------------------------------------------------ */
alter table users rename column nama to name;

/* residents (was warga) -------------------------------------------------- */
alter table residents rename column nama     to name;
alter table residents rename column blok     to block;
alter table residents rename column no_rumah to house_number;
alter table residents rename column no_hp    to phone;
alter table residents rename column aktif    to active;

/* memberships (was user_membership) ------------------------------------- */
alter table memberships rename column warga_id to resident_id;

/* payment_confirmations (was konfirmasi_pembayaran) -------------------- */
alter table payment_confirmations rename column warga_id         to resident_id;
alter table payment_confirmations rename column tahun            to year;
alter table payment_confirmations rename column total_bayar      to total_amount;
alter table payment_confirmations rename column bukti_url        to proof_url;
alter table payment_confirmations rename column alasan_penolakan to rejection_reason;

/* confirmation_details (was detail_konfirmasi_pembayaran) -------------- */
alter table confirmation_details rename column konfirmasi_id to confirmation_id;
alter table confirmation_details rename column warga_id      to resident_id;
alter table confirmation_details rename column tahun         to year;
alter table confirmation_details rename column bulan         to month;
alter table confirmation_details rename column nominal       to amount;

/* payments (was pembayaran) --------------------------------------------- */
alter table payments rename column warga_id    to resident_id;
alter table payments rename column tahun       to year;
alter table payments rename column tanggal     to date;
alter table payments rename column jumlah_bayar to total_amount;
alter table payments rename column metode      to method;
alter table payments rename column keterangan  to notes;

/* payment_details (was detail_pembayaran) ------------------------------- */
alter table payment_details rename column pembayaran_id to payment_id;
alter table payment_details rename column warga_id      to resident_id;
alter table payment_details rename column tahun         to year;
alter table payment_details rename column bulan         to month;
alter table payment_details rename column nominal       to amount;

/* expense_categories (was pengeluaran_kategori) ------------------------- */
alter table expense_categories rename column nama   to name;
alter table expense_categories rename column urutan to sort_order;

/* expenses (was pengeluaran) ------------------------------------------- */
alter table expenses rename column nomor_bukti       to receipt_number;
alter table expenses rename column tanggal           to date;
alter table expenses rename column kategori          to category;
alter table expenses rename column nominal           to amount;
alter table expenses rename column penerima          to recipient;
alter table expenses rename column deskripsi         to description;
alter table expenses rename column nota_url          to receipt_url;
alter table expenses rename column aktif             to active;
alter table expenses rename column catatan_penolakan to rejection_note;

/* ledger ---------------------------------------------------------------- */
alter table ledger rename column jenis        to type;
alter table ledger rename column sumber       to source;
alter table ledger rename column referensi_id to reference_id;
alter table ledger rename column tanggal      to date;
alter table ledger rename column deskripsi    to description;
alter table ledger rename column nominal      to amount;
alter table ledger rename column saldo_setelah to balance_after;
alter table ledger rename column aktif        to active;

/* registration_requests ------------------------------------------------- */
alter table registration_requests rename column rt_kode         to rt_code;
alter table registration_requests rename column nama_ketua      to chair_name;
alter table registration_requests rename column email_ketua     to chair_email;
alter table registration_requests rename column nama_admin      to admin_name;
alter table registration_requests rename column email_admin     to admin_email;
alter table registration_requests rename column email_bendahara to treasurer_email;
alter table registration_requests rename column nama_bendahara  to treasurer_name;
alter table registration_requests rename column nama_warga      to resident_name;
alter table registration_requests rename column email_warga     to resident_email;
alter table registration_requests rename column blok            to block;
alter table registration_requests rename column no_rumah        to house_number;
alter table registration_requests rename column no_hp           to phone;


/* ============================================================================
 * 4. RECREATE STORED FUNCTIONS
 *
 * Every function whose body references a renamed table, column, or enum value
 * must be recreated.  Using CREATE OR REPLACE is safe because the function
 * signatures (argument types) are unchanged.
 * ========================================================================= */

/* get_last_saldo --------------------------------------------------------- */
create or replace function get_last_saldo(p_rt_id uuid)
returns bigint
language plpgsql
as $$
declare
    v_saldo bigint;
begin
    select balance_after
    into   v_saldo
    from   ledger
    where  rt_id = p_rt_id
    order  by date desc
    limit  1;

    return coalesce(v_saldo, 0);
end;
$$;


/* insert_ledger ---------------------------------------------------------- */
create or replace function insert_ledger(
    p_rt_id        uuid,
    p_type         varchar,
    p_source       varchar,
    p_reference_id uuid,
    p_date         timestamptz,
    p_description  text,
    p_amount       bigint,
    p_created_by   uuid
)
returns uuid
language plpgsql
as $$
declare
    v_last_balance bigint;
    v_new_balance  bigint;
    v_id           uuid;
begin
    v_last_balance := get_last_saldo(p_rt_id);

    if p_type = 'pemasukan' then
        v_new_balance := v_last_balance + p_amount;
    else
        v_new_balance := v_last_balance - p_amount;
    end if;

    insert into ledger (
        rt_id,
        type,
        source,
        reference_id,
        date,
        description,
        amount,
        balance_after,
        created_by
    ) values (
        p_rt_id,
        p_type,
        p_source,
        p_reference_id,
        p_date,
        p_description,
        p_amount,
        v_new_balance,
        p_created_by
    )
    returning id into v_id;

    return v_id;
end;
$$;

-- Revoke/grant preserved from original
revoke all     on function insert_ledger(uuid, varchar, varchar, uuid, timestamptz, text, bigint, uuid) from public;
grant  execute on function insert_ledger(uuid, varchar, varchar, uuid, timestamptz, text, bigint, uuid) to service_role;


/* is_super_admin --------------------------------------------------------- */
create or replace function is_super_admin()
returns boolean
language sql
security definer
stable
as $$
    select exists (
        select 1
        from   memberships
        where  user_id = auth.uid()
        and    role    = 'SUPER_ADMIN'
    )
$$;


/* get_user_rt_ids -------------------------------------------------------- */
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


/* is_member_of_rt -------------------------------------------------------- */
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


/* generate_rt_code ------------------------------------------------------- */
create or replace function generate_rt_code()
returns text
language plpgsql
security definer
as $$
declare
    next_num  integer;
    candidate text;
begin
    select coalesce(
        max(
            case
                when code ~ '^RT-[0-9]{4}$'
                then substring(code from 4)::integer
                else 0
            end
        ), 0
    ) + 1
    into next_num
    from rt
    where code ~ '^RT-[0-9]{4}$';

    select greatest(
        next_num,
        coalesce(
            (
                select max(
                    case
                        when (rt_data->>'code') ~ '^RT-[0-9]{4}$'
                        then substring(rt_data->>'code' from 4)::integer
                        -- fall back to old key for in-flight registrations submitted
                        -- before the rename; remove after all pending requests clear
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


/* notify_on_new_registration -------------------------------------------- */
create or replace function notify_on_new_registration()
returns trigger
language plpgsql
security definer
as $$
declare
    v_user record;
    v_rt_name text;
begin
    if new.type = 'rt' then
        -- Support both new ('name') and legacy ('nama') rt_data keys during
        -- the transition period while pending registrations are cleared.
        v_rt_name := coalesce(new.rt_data->>'name', new.rt_data->>'nama');

        insert into activity_logs (
            rt_id, actor_id, actor_name, action,
            entity_type, entity_id, description, metadata
        ) values (
            '00000000-0000-0000-0000-000000000001',
            null,
            v_rt_name,
            'SUBMIT_RT_REGISTRATION',
            'registration_requests',
            new.id,
            'New RT registration request submitted: "' || v_rt_name || '"',
            jsonb_build_object('rt_code', new.rt_code, 'chair_email', new.chair_email)
        );

        for v_user in
            select user_id from memberships where role = 'SUPER_ADMIN'
        loop
            insert into notifications (
                rt_id, type, title, message,
                entity_type, entity_id, target_user_id
            ) values (
                '00000000-0000-0000-0000-000000000001',
                'registration',
                'New RT Registration Request',
                'RT "' || v_rt_name || '" (' || coalesce(new.rt_code, '-') || ') submitted a registration request.',
                'registration_requests',
                new.id,
                v_user.user_id
            );
        end loop;

    elsif new.type = 'warga' and new.rt_id is not null then
        insert into activity_logs (
            rt_id, actor_id, actor_name, action,
            entity_type, entity_id, description, metadata
        ) values (
            new.rt_id,
            null,
            new.resident_name,
            'SUBMIT_WARGA_REGISTRATION',
            'registration_requests',
            new.id,
            'New resident registration request submitted: "' || new.resident_name || '"',
            jsonb_build_object('email', new.resident_email, 'rt_code', new.rt_code)
        );

        for v_user in
            select user_id from memberships
            where  rt_id = new.rt_id
            and    role  in ('CHAIR', 'ADMIN')
        loop
            insert into notifications (
                rt_id, type, title, message,
                entity_type, entity_id, target_user_id
            ) values (
                new.rt_id,
                'registration',
                'New Resident Registration Request',
                '"' || new.resident_name || '" has submitted a request to join your RT.',
                'registration_requests',
                new.id,
                v_user.user_id
            );
        end loop;

    end if;

    return new;
end;
$$;


/* approve_konfirmasi ----------------------------------------------------- */
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

    -- Fetch the resident's user account scoped to this RT.
    select * into v_member
    from   memberships
    where  resident_id = v_confirmation.resident_id
    and    rt_id       = v_confirmation.rt_id;

    -- 3. Duplicate month check
    if exists (
        select 1
        from   payment_details   pd
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

    -- 6. Copy monthly details
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

revoke all     on function approve_konfirmasi(uuid, uuid) from public;
grant  execute on function approve_konfirmasi(uuid, uuid) to authenticated;


/* reject_konfirmasi ------------------------------------------------------ */
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

revoke all     on function reject_konfirmasi(uuid, text, uuid) from public;
grant  execute on function reject_konfirmasi(uuid, text, uuid) to authenticated;


/* approve_pengeluaran → approve_expense --------------------------------- */
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
    select * into v_row
    from   expenses
    where  id = p_id
    for update;

    if not found then
        raise exception 'Pengeluaran tidak ditemukan'
            using errcode = 'KW020';
    end if;

    if v_row.status != 'pending' then
        raise exception 'Pengeluaran sudah diproses'
            using errcode = 'KW021';
    end if;

    update expenses
    set    status      = 'approved',
           approved_by = p_user_id,
           approved_at = now()
    where  id = p_id;

    perform insert_ledger(
        v_row.rt_id,
        'pengeluaran',
        'pengeluaran',
        p_id,
        now(),
        coalesce(v_row.description, 'Pengeluaran RT'),
        v_row.amount::bigint,
        p_user_id
    );

    if v_row.created_by is not null then
        insert into notifications (
            rt_id, type, title, message, entity_type, entity_id, target_user_id
        ) values (
            v_row.rt_id,
            'expense_approved',
            'Pengeluaran Disetujui',
            'Pengeluaran ' || coalesce(v_row.receipt_number, '') || ' telah disetujui',
            'expenses',
            p_id,
            v_row.created_by
        );
    end if;
end;
$$;

revoke all     on function approve_pengeluaran(uuid, uuid) from public;
grant  execute on function approve_pengeluaran(uuid, uuid) to authenticated;


/* reject_pengeluaran ----------------------------------------------------- */
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
    select * into v_row
    from   expenses
    where  id = p_id
    for update;

    if not found then
        raise exception 'Pengeluaran tidak ditemukan'
            using errcode = 'KW020';
    end if;

    if v_row.status != 'pending' then
        raise exception 'Pengeluaran sudah diproses'
            using errcode = 'KW021';
    end if;

    update expenses
    set    status         = 'rejected',
           approved_by    = p_user_id,
           rejection_note = p_alasan
    where  id = p_id;

    if v_row.created_by is not null then
        insert into notifications (
            rt_id, type, title, message, entity_type, entity_id, target_user_id
        ) values (
            v_row.rt_id,
            'expense_rejected',
            'Pengeluaran Ditolak',
            'Pengeluaran ' || coalesce(v_row.receipt_number, '') || ' ditolak' ||
                case when p_alasan is not null and p_alasan != ''
                     then '. Alasan: ' || p_alasan
                     else ''
                end,
            'expenses',
            p_id,
            v_row.created_by
        );
    end if;
end;
$$;

revoke all     on function reject_pengeluaran(uuid, text, uuid) from public;
grant  execute on function reject_pengeluaran(uuid, text, uuid) to authenticated;


/* approve_all_pending_pengeluaran --------------------------------------- */
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
        from   expenses
        where  rt_id  = p_rt_id
        and    status = 'pending'
        and    active = true
        for update skip locked
    loop
        update expenses
        set    status      = 'approved',
               approved_by = p_user_id,
               approved_at = now()
        where  id = v_row.id;

        perform insert_ledger(
            v_row.rt_id,
            'pengeluaran',
            'pengeluaran',
            v_row.id,
            coalesce(v_row.date::timestamptz, now()),
            coalesce(v_row.description, v_row.category, 'Pengeluaran'),
            v_row.amount::bigint,
            p_user_id
        );

        if v_row.created_by is not null then
            insert into notifications (
                rt_id, type, title, message, entity_type, entity_id, target_user_id
            ) values (
                v_row.rt_id,
                'expense_approved',
                'Pengeluaran Disetujui',
                'Pengeluaran ' || coalesce(v_row.receipt_number, '') ||
                    ' sebesar Rp ' || v_row.amount || ' telah disetujui.',
                'expenses',
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


/* populate_cashflow (dev/seed utility) ----------------------------------- */
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
    v_resident_id         uuid;
    v_payment_id          uuid;
    v_month_count         int;
    v_rt                  record;
    v_total_amount        bigint;
    v_total_income        bigint  := 0;
    v_target_expense      bigint;
    v_current_expense     bigint  := 0;
    v_categories          text[]  := array['sosial', 'operasional', 'kebersihan', 'keamanan', 'kegiatan'];
    v_descriptions        text[]  := array[
        'Bantuan warga sakit', 'Pembelian alat kebersihan',
        'Konsumsi rapat',      'Perbaikan fasilitas',       'Honor keamanan'
    ];
    v_month               int;
    v_selected_months     int[]   := '{}';
    v_random_month        int;
    v_date                timestamp;
begin
    select id, monthly_fee into v_rt from rt limit 1;

    if v_rt.monthly_fee is null then
        raise exception 'Nominal iuran pada RT belum diatur';
    end if;

    delete from payment_details where year = p_tahun;
    delete from payments        where year = p_tahun;
    delete from expenses        where extract(year from date) = p_tahun;

    for i in 1..p_jumlah_data loop
        select id into v_resident_id from residents order by random() limit 1;

        v_month_count     := floor(random() * p_max_bulan + 1);
        v_selected_months := '{}';

        while array_length(v_selected_months, 1) is null
           or array_length(v_selected_months, 1) < v_month_count loop

            v_random_month := floor(random() * 12 + 1);

            if not (v_random_month = any(v_selected_months)) then
                if not exists (
                    select 1 from payment_details
                    where  resident_id = v_resident_id
                    and    year        = p_tahun
                    and    month       = v_random_month
                ) then
                    v_selected_months := array_append(v_selected_months, v_random_month);
                end if;
            end if;
        end loop;

        v_total_amount := v_month_count * v_rt.monthly_fee;
        v_date         := now() - (floor(random() * 120) || ' days')::interval;

        insert into payments (resident_id, rt_id, year, total_amount, date, created_at)
        values (v_resident_id, v_rt.id, p_tahun, v_total_amount, v_date, now())
        returning id into v_payment_id;

        foreach v_month in array v_selected_months loop
            insert into payment_details (payment_id, resident_id, year, month, amount, created_at)
            values (v_payment_id, v_resident_id, p_tahun, v_month, v_rt.monthly_fee, now());
        end loop;

        v_total_income := v_total_income + v_total_amount;
    end loop;

    v_target_expense := (v_total_income * p_rasio_pengeluaran)::bigint;

    while v_current_expense < v_target_expense loop
        v_total_amount := (floor(random() * 5) + 1) * v_rt.monthly_fee;

        exit when (v_current_expense + v_total_amount) > v_target_expense;

        insert into expenses (rt_id, category, description, amount, date, created_at)
        values (
            v_rt.id,
            v_categories[floor(random() * 5) + 1],
            v_descriptions[floor(random() * 5) + 1],
            v_total_amount,
            now() - (floor(random() * 120) || ' days')::interval,
            now()
        );

        v_current_expense := v_current_expense + v_total_amount;
    end loop;
end;
$$;

revoke all     on function populate_cashflow(int, int, int, numeric) from public;
grant  execute on function populate_cashflow(int, int, int, numeric) to service_role;


/* ============================================================================
 * 5. UPDATE RLS POLICIES THAT EMBED ENUM LITERAL VALUES
 *
 * The 'admin read warga requests' policy embeds role string literals that
 * changed from ('admin', 'ketua') to ('ADMIN', 'CHAIR').  PostgreSQL stores
 * the parse tree with OIDs, so after renaming the table the policy is still
 * valid — but the string literal comparison does not auto-update.
 * ========================================================================= */

drop policy if exists "registration: admin read warga requests for own rt"
    on registration_requests;

create policy "registration: admin read warga requests for own rt"
    on registration_requests for select to authenticated
    using (
        type  = 'warga'
        and rt_id in (
            select rt_id
            from   memberships
            where  user_id = auth.uid()
            and    role    in ('ADMIN', 'CHAIR')
        )
    );
