/*
|--------------------------------------------------------------------------
| REGISTRATION REQUESTS
| Stores both RT and Warga registration requests pending approval
|--------------------------------------------------------------------------
*/

create table if not exists registration_requests (
    id                  uuid        primary key default gen_random_uuid(),
    type                text        not null check (type in ('rt', 'warga')),
    status              text        not null default 'pending'
                                    check (status in ('pending', 'approved', 'rejected', 'expired')),

    -- Common fields
    nama                text        not null,
    email               text        not null,

    -- Warga-specific
    rt_kode             text,
    blok                text,
    no_rumah            text,
    no_hp               text,

    -- RT-specific (full RT form data stored as JSON)
    rt_data             jsonb,
    email_ketua         text,
    email_admin         text,
    email_bendahara     text,

    -- Linked RT (set after approval)
    rt_id               uuid        references rt(id) on delete set null,

    -- Approval / rejection tracking
    approved_by         uuid        references users(id) on delete set null,
    approved_at         timestamptz,
    rejected_by         uuid        references users(id) on delete set null,
    rejected_at         timestamptz,
    rejection_reason    text,

    -- Auto-expiry (30 days for pending requests)
    expires_at          timestamptz not null default (now() + interval '30 days'),

    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

alter table registration_requests enable row level security;

-- Super admin can read all RT registration requests
create policy "super_admin can read rt requests"
    on registration_requests
    for select
    to authenticated
    using (type = 'rt' and is_super_admin());

-- Admin / ketua can read warga requests for their RT
create policy "admin can read warga requests for own rt"
    on registration_requests
    for select
    to authenticated
    using (
        type = 'rt_kode' is not null
        or (
            type = 'warga'
            and rt_id in (
                select rt_id from user_membership
                where  user_id = auth.uid()
                and    role    in ('admin', 'ketua')
            )
        )
    );

-- Allow anon / authenticated to insert (public registration)
create policy "anyone can submit registration"
    on registration_requests
    for insert
    to anon, authenticated
    with check (true);

-- Only authenticated (admins/ketua/super_admin) can update status
create policy "authenticated can update registration"
    on registration_requests
    for update
    to authenticated
    using (true);

-- Only authenticated can delete (reject hard-delete for warga)
create policy "authenticated can delete registration"
    on registration_requests
    for delete
    to authenticated
    using (true);

/*
|--------------------------------------------------------------------------
| ACTIVATION INVITES
| Tracks email invite links sent to approved users
|--------------------------------------------------------------------------
*/

create table if not exists activation_invites (
    id                      uuid        primary key default gen_random_uuid(),
    registration_request_id uuid        not null references registration_requests(id) on delete cascade,
    email                   text        not null,
    role                    text        not null,
    rt_id                   uuid        references rt(id) on delete cascade,

    sent_at                 timestamptz not null default now(),
    expires_at              timestamptz not null default (now() + interval '1 day'),
    activated_at            timestamptz,

    resend_count            integer     not null default 0,

    created_at              timestamptz not null default now()
);

alter table activation_invites enable row level security;

-- Service role (API routes) handles all activation_invites operations
-- Allow anon to read their own invites by email for activation flow
create policy "anyone can read invite by email"
    on activation_invites
    for select
    to anon, authenticated
    using (true);

create policy "authenticated can insert invite"
    on activation_invites
    for insert
    to authenticated
    with check (true);

create policy "authenticated can update invite"
    on activation_invites
    for update
    to authenticated
    using (true);

/*
|--------------------------------------------------------------------------
| GENERATE RT CODE
| Generates next available RT-XXXX code
|--------------------------------------------------------------------------
*/

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
                when kode ~ '^RT-[0-9]{4}$'
                then (substring(kode from 4))::integer
                else 0
            end
        ), 0
    ) + 1
    into next_num
    from rt
    where kode ~ '^RT-[0-9]{4}$';

    -- Also check registration_requests for reserved codes
    select greatest(next_num,
        coalesce(
            (
                select max(
                    case
                        when (rt_data->>'kode') ~ '^RT-[0-9]{4}$'
                        then (substring(rt_data->>'kode' from 4))::integer
                        else 0
                    end
                )
                from registration_requests
                where type = 'rt'
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

/*
|--------------------------------------------------------------------------
| CLEANUP EXPIRED REGISTRATIONS
| Nightly job marks pending requests older than 30 days as expired
|--------------------------------------------------------------------------
*/

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

-- Schedule nightly cleanup at 02:00 UTC (requires pg_cron extension)
-- Run this manually if pg_cron is not enabled:
-- select cron.schedule('cleanup-expired-registrations', '0 2 * * *', 'select cleanup_expired_registrations()');

/*
|--------------------------------------------------------------------------
| UPDATED_AT TRIGGER
|--------------------------------------------------------------------------
*/

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
