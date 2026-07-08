/*
 * =============================================================================
 * 003_REGISTRATION
 * Registration requests for new RTs and Residents, plus activation invite tracking.
 * This is the entry point of the entire onboarding business flow.
 * Depends on: 000_foundation (rt, users)
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * TABLE: registration_requests
 * Stores pending RT and Resident registration requests awaiting approval.
 *
 * For RT registrations:
 *   - chair_email      = chair's email (receives activation invite on approval)
 *   - chair_name       = chair's full name
 *   - admin_email      = admin's email
 *   - admin_name       = admin's full name
 *   - treasurer_email  = treasurer's email
 *   - treasurer_name   = treasurer's full name
 *   - rt_data          = full RT form data as JSON (name, code, address, etc.)
 *
 * For Resident registrations:
 *   - resident_email = resident's email
 *   - rt_code        = code of the target RT
 *   - rt_id          = resolved RT id (set on submit after validating rt_code)
 * --------------------------------------------------------------------------- */

create table registration_requests (
    id               uuid        primary key default gen_random_uuid(),

    -- Request type and lifecycle status
    type             text        not null check (type in ('rt', 'resident')),
    status           text        not null default 'pending'
                                 check (status in ('pending', 'approved', 'rejected', 'expired')),

    -- RT registration fields
    rt_code          text,
    rt_data          jsonb,
    chair_name       text,
    chair_email      text,
    admin_name       text,
    admin_email      text,
    treasurer_email  text,
    treasurer_name   text,

    -- Resident registration fields
    -- Requestor identity (null for RT registrations)
    resident_name    text,
    resident_email   text,

    block            text,
    house_number     text,
    phone            text,

    -- Linked RT (set on resident submit; created on RT approval)
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
            new.rt_data->>'name',
            'SUBMIT_RT_REGISTRATION',
            'registration_requests',
            new.id,
            'New RT registration request submitted: "' || (new.rt_data->>'name') || '"',
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
    'RT "' || (new.rt_data->>'name') || '" (' || coalesce(new.rt_code, '-') || ') submitted a registration request.',
    'registration_requests',
    new.id,
    v_user.user_id
    );
end loop;

    /* ---------------------------------------------------------------------- */
    /* WARGA REGISTRATION                                                       */
    /* ---------------------------------------------------------------------- */

    elsif new.type = 'resident' and new.rt_id is not null then

        insert into activity_logs (
            rt_id, actor_id, actor_name, action,
            entity_type, entity_id, description, metadata
        ) values (
            new.rt_id,
            null,
            new.resident_name,
            'RESIDENT_REGISTER_REQUEST',
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


create trigger registration_notify_trigger
    after insert on registration_requests
    for each row execute function notify_on_new_registration();
