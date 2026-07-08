/*
 * =============================================================================
 * 005_FUNCTIONS
 * All stored functions and triggers, ordered by dependency.
 * Depends on: 000_foundation, 001_financial, 002_communication, 003_registration
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * get_last_balance
 * Returns the most recent ledger balance for an RT (0 if no entries yet).
 * --------------------------------------------------------------------------- */

create or replace function get_last_balance(p_rt_id uuid)
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


/* ----------------------------------------------------------------------------
 * insert_ledger
 * Appends a ledger entry with a running balance and returns the new row id.
 * --------------------------------------------------------------------------- */

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
    v_last_balance := get_last_balance(p_rt_id);

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


/* ----------------------------------------------------------------------------
 * is_super_admin
 * Returns true when the currently authenticated user holds the SUPER_ADMIN role.
 *
 * SECURITY DEFINER is required here: querying memberships from within its
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
        from   memberships
        where  user_id = auth.uid()
        and    role    = 'SUPER_ADMIN'
    )
$$;


/* ----------------------------------------------------------------------------
 * get_user_rt_ids
 * Returns every RT ID that the current user actively belongs to.
 * Used as the core predicate in RT-scoped RLS policies.
 * --------------------------------------------------------------------------- */

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


/* ----------------------------------------------------------------------------
 * is_member_of_rt
 * Returns true when the current user is an active member of p_rt_id.
 * Used in INSERT / UPDATE with-check policies.
 * --------------------------------------------------------------------------- */

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

create trigger trg_users_updated_at
    before update on users
    for each row execute function set_updated_at();

create trigger trg_residents_updated_at
    before update on residents
    for each row execute function set_updated_at();

create trigger trg_notifications_updated_at
    before update on notifications
    for each row execute function set_updated_at();

create trigger trg_expenses_updated_at
    before update on expenses
    for each row execute function set_updated_at();

create trigger trg_expense_categories_updated_at
    before update on expense_categories
    for each row execute function set_updated_at();


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
                when code ~ '^RT-[0-9]{4}$'
                then substring(code from 4)::integer
                else 0
            end
        ), 0
    ) + 1
    into next_num
    from rt
    where code ~ '^RT-[0-9]{4}$';

    -- Also account for codes reserved by in-flight registration requests
    select greatest(
        next_num,
        coalesce(
            (
                select max(
                    case
                        when (rt_data->>'code') ~ '^RT-[0-9]{4}$'
                        then substring(rt_data->>'code' from 4)::integer
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
 * approve_confirmation
 *
 * Flow:
 *   1. Lock the payment_confirmations row
 *   2. Validate status is still pending
 *   3. Validate no month in the request has already been paid
 *   4. Validate total matches expected amount
 *   5. Insert payments header
 *   6. Copy monthly detail rows to payment_details
 *   7. Mark payment_confirmations as approved
 *   8. Append a ledger entry
 *   9. Send in-app notification to resident
 * --------------------------------------------------------------------------- */

create or replace function approve_confirmation(
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
 * reject_confirmation
 *
 * Flow:
 *   1. Lock the payment_confirmations row
 *   2. Validate status is still pending
 *   3. Mark as rejected with reason
 *   4. Send in-app notification to resident
 * --------------------------------------------------------------------------- */

create or replace function reject_confirmation(
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

revoke all     on function approve_confirmation(uuid, uuid)      from public;
revoke all     on function reject_confirmation(uuid, text, uuid) from public;
grant  execute on function approve_confirmation(uuid, uuid)      to authenticated;
grant  execute on function reject_confirmation(uuid, text, uuid) to authenticated;


/* ----------------------------------------------------------------------------
 * populate_cashflow  — development / seeding utility
 * Generates synthetic payments and expenses records for testing.
 * Restricted to service_role so it cannot be called from the browser client.
 * --------------------------------------------------------------------------- */

create or replace function populate_cashflow(
    p_year             int,
    p_data_count       int     default 100,
    p_max_months         int     default 3,
    p_expense_ratio numeric default 0.8
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

    -- Clear existing data for the year
    delete from payment_details where year = p_year;
    delete from payments        where year = p_year;
    delete from expenses        where extract(year from date) = p_year;

    -- Generate payments
    for i in 1..p_data_count loop
        select id into v_resident_id from residents order by random() limit 1;

        v_month_count     := floor(random() * p_max_months + 1);
        v_selected_months := '{}';

        while array_length(v_selected_months, 1) is null
           or array_length(v_selected_months, 1) < v_month_count loop

            v_random_month := floor(random() * 12 + 1);

            if not (v_random_month = any(v_selected_months)) then
                if not exists (
                    select 1 from payment_details
                    where  resident_id = v_resident_id
                    and    year        = p_year
                    and    month       = v_random_month
                ) then
                    v_selected_months := array_append(v_selected_months, v_random_month);
                end if;
            end if;
        end loop;

        v_total_amount := v_month_count * v_rt.monthly_fee;
        v_date         := now() - (floor(random() * 120) || ' days')::interval;

        insert into payments (resident_id, rt_id, year, total_amount, date, created_at)
        values (v_resident_id, v_rt.id, p_year, v_total_amount, v_date, now())
        returning id into v_payment_id;

        foreach v_month in array v_selected_months loop
            insert into payment_details (payment_id, resident_id, year, month, amount, created_at)
            values (v_payment_id, v_resident_id, p_year, v_month, v_rt.monthly_fee, now());
        end loop;

        v_total_income := v_total_income + v_total_amount;
    end loop;

    -- Generate expenses proportional to total income
    v_target_expense := (v_total_income * p_expense_ratio)::bigint;

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

-- Utility functions: restrict access to safe roles
revoke all     on function populate_cashflow(int, int, int, numeric)                                       from public;
revoke all     on function insert_ledger(uuid, varchar, varchar, uuid, timestamptz, text, bigint, uuid)    from public;
revoke all     on function get_last_balance(uuid)                                                            from public;

grant  execute on function populate_cashflow(int, int, int, numeric)                                       to service_role;
grant  execute on function insert_ledger(uuid, varchar, varchar, uuid, timestamptz, text, bigint, uuid)    to service_role;
grant  execute on function get_last_balance(uuid)                                                            to authenticated;


/* ----------------------------------------------------------------------------
 * approve_expense
 *
 * Flow:
 *   1. Lock the expenses row
 *   2. Validate status is still pending
 *   3. Mark as approved with timestamp and approver
 *   4. Append a ledger debit entry
 *   5. Notify the expense creator
 * --------------------------------------------------------------------------- */

create or replace function approve_expense(
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
    from   expenses
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
    update expenses
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
        coalesce(v_row.description, 'Pengeluaran RT'),
        v_row.amount::bigint,
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
            'Pengeluaran ' || coalesce(v_row.receipt_number, '') || ' telah disetujui',
            'expenses',
            p_id,
            v_row.created_by
        );
    end if;
end;
$$;


/* ----------------------------------------------------------------------------
 * reject_expense
 *
 * Flow:
 *   1. Lock the expenses row
 *   2. Validate status is still pending
 *   3. Mark as rejected with reason
 *   4. Notify the expense creator
 * --------------------------------------------------------------------------- */

create or replace function reject_expense(
    p_id      uuid,
    p_reason  text,
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
    from   expenses
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
    update expenses
    set    status          = 'rejected',
           approved_by     = p_user_id,
           rejection_note  = p_reason
    where  id = p_id;

    -- 4. Notify creator
    if v_row.created_by is not null then
        insert into notifications (
            rt_id, type, title, message, entity_type, entity_id, target_user_id
        ) values (
            v_row.rt_id,
            'expense_rejected',
            'Pengeluaran Ditolak',
            'Pengeluaran ' || coalesce(v_row.receipt_number, '') || ' ditolak' ||
                case when p_reason is not null and p_reason != ''
                     then '. Alasan: ' || p_reason
                     else ''
                end,
            'expenses',
            p_id,
            v_row.created_by
        );
    end if;
end;
$$;

revoke all     on function approve_expense(uuid, uuid)       from public;
revoke all     on function reject_expense(uuid, text, uuid)  from public;
grant  execute on function approve_expense(uuid, uuid)       to authenticated;
grant  execute on function reject_expense(uuid, text, uuid)  to authenticated;


/* ----------------------------------------------------------------------------
 * approve_all_pending_expenses
 *
 * Approves every pending expense for the given RT atomically.
 * Returns the count of rows approved.
 * --------------------------------------------------------------------------- */

create or replace function approve_all_pending_expenses(
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

revoke all     on function approve_all_pending_expenses(uuid, uuid) from public;
grant  execute on function approve_all_pending_expenses(uuid, uuid) to authenticated;
