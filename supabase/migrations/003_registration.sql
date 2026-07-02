/*
 * =============================================================================
 * 003_REGISTRATION
 * Registration requests for new RTs and Warga, plus activation invite tracking.
 * This is the entry point of the entire onboarding business flow.
 * Depends on: 000_foundation (rt, users)
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * TABLE: registration_requests
 * Stores pending RT and Warga registration requests awaiting approval.
 *
 * For RT registrations:
 *   - email           = ketua's email (receives activation invite on approval)
 *   - nama_ketua      = ketua's full name
 *   - email_admin     = admin's email
 *   - nama_admin      = admin's full name
 *   - email_bendahara = bendahara's email
 *   - nama_bendahara  = bendahara's full name
 *   - rt_data         = full RT form data as JSON (nama, kode, alamat, etc.)
 *
 * For Warga registrations:
 *   - email   = warga's email
 *   - rt_kode = code of the target RT
 *   - rt_id   = resolved RT id (set on submit after validating rt_kode)
 * --------------------------------------------------------------------------- */

create table registration_requests (
    id               uuid        primary key default gen_random_uuid(),

    -- Request type and lifecycle status
    type             text        not null check (type in ('rt', 'warga')),
    status           text        not null default 'pending'
                                 check (status in ('pending', 'approved', 'rejected', 'expired')),

    -- RT registration fields
    rt_kode          text,
    rt_data          jsonb,
    nama_ketua       text,
    email_ketua      text,
    nama_admin       text,
    email_admin      text,
    email_bendahara  text,
    nama_bendahara   text,

    -- Warga registration fields
    -- Requestor identity (null for RT registrations)
    nama_warga       text,
    email_warga      text,

    blok             text,
    no_rumah         text,
    no_hp            text,

    -- Linked RT (set on warga submit; created on RT approval)
    rt_id            uuid        references rt (id) on delete set null,

    -- Approval / rejection tracking
    approved_by      uuid        references users (id) on delete set null,
    approved_at      timestamptz,
    rejected_by      uuid        references users (id) on delete set null,
    rejected_at      timestamptz,
    rejection_reason text,

    -- Nightly job marks pending rows past this timestamp as expired
    expires_at       timestamptz not null default (now() + interval '30 days'),

    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);


/* ----------------------------------------------------------------------------
 * TABLE: activation_invites
 * Tracks email invite links sent to users after their registration is approved.
 * One row per invite attempt; resend_count increments on each resend.
 * --------------------------------------------------------------------------- */

create table activation_invites (
    id                      uuid        primary key default gen_random_uuid(),
    registration_request_id uuid        not null references registration_requests (id) on delete cascade,
    email                   text        not null,
    role                    text        not null,
    rt_id                   uuid        references rt (id) on delete cascade,
    sent_at                 timestamptz not null default now(),
    expires_at              timestamptz not null default (now() + interval '1 day'),
    activated_at            timestamptz,
    resend_count            integer     not null default 0,
    created_at              timestamptz not null default now()
);

/*
 * =============================================================================
 * REGISTRATION_NOTIFICATIONS
 * Trigger-based activity logging and in-app notifications for new registration
 * requests. Runs as security definer to bypass RLS on activity_logs and
 * notifications, which only allow authenticated inserts — registrants are
 * unauthenticated (anon) at submission time.
 * =============================================================================
 */

create or replace function notify_on_new_registration()
returns trigger
language plpgsql
security definer
as $$
declare
v_user record;
begin

    /* ---------------------------------------------------------------------- */
    /* RT REGISTRATION                                                          */
    /* ---------------------------------------------------------------------- */

    if new.type = 'rt' then

        insert into activity_logs (
            rt_id, actor_id, actor_name, action,
            entity_type, entity_id, description, metadata
        ) values (
            '00000000-0000-0000-0000-000000000001',
            null,
            new.rt_data->>'nama',
            'SUBMIT_RT_REGISTRATION',
            'registration_requests',
            new.id,
            'New RT registration request submitted: "' || (new.rt_data->>'nama') || '"',
            jsonb_build_object('rt_kode', new.rt_kode, 'email_ketua', new.email_ketua)
        );

for v_user in
select user_id from user_membership where role = 'super_admin'
    loop
insert into notifications (
    rt_id, type, title, message,
    entity_type, entity_id, target_user_id
) values (
    '00000000-0000-0000-0000-000000000001',
    'registration',
    'New RT Registration Request',
    'RT "' || (new.rt_data->>'nama') || '" (' || coalesce(new.rt_kode, '-') || ') submitted a registration request.',
    'registration_requests',
    new.id,
    v_user.user_id
    );
end loop;

    /* ---------------------------------------------------------------------- */
    /* WARGA REGISTRATION                                                       */
    /* ---------------------------------------------------------------------- */

    elsif new.type = 'warga' and new.rt_id is not null then

        insert into activity_logs (
            rt_id, actor_id, actor_name, action,
            entity_type, entity_id, description, metadata
        ) values (
            new.rt_id,
            null,
            new.nama_warga,
            'SUBMIT_WARGA_REGISTRATION',
            'registration_requests',
            new.id,
            'New warga registration request submitted: "' || new.nama_warga || '"',
            jsonb_build_object('email', new.email_warga, 'rt_kode', new.rt_kode)
        );

for v_user in
select user_id from user_membership
where  rt_id = new.rt_id
  and    role  in ('ketua', 'admin')
    loop
insert into notifications (
    rt_id, type, title, message,
    entity_type, entity_id, target_user_id
) values (
    new.rt_id,
    'registration',
    'New Warga Registration Request',
    '"' || new.nama_warga || '" has submitted a request to join your RT.',
    'registration_requests',
    new.id,
    v_user.user_id
    );
end loop;

end if;

return new;
end;
$$;


create trigger registration_notify_trigger
    after insert on registration_requests
    for each row execute function notify_on_new_registration();