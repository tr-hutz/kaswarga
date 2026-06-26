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
 *   - email       = ketua's email (receives activation invite on approval)
 *   - email_admin = admin's email
 *   - email_bendahara = bendahara's email
 *   - rt_data     = full RT form data as JSON (nama, kode, alamat, etc.)
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

    -- Requestor identity
    nama             text        not null,
    email            text        not null,

    -- RT registration fields
    rt_kode          text,
    rt_data          jsonb,
    email_admin      text,
    email_bendahara  text,

    -- Warga registration fields
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
