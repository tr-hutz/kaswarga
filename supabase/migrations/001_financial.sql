/*
 * =============================================================================
 * 001_FINANCIAL
 * Payment confirmation, approved payment, expense, and ledger tables.
 * Depends on: 000_foundation (rt, residents)
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * TABLE: payment_confirmations
 * A resident submits this record as proof of payment, pending admin approval.
 * --------------------------------------------------------------------------- */

create table payment_confirmations (
    id               uuid        primary key default gen_random_uuid(),
    resident_id      uuid        not null references residents (id) on delete cascade,
    rt_id            uuid        not null references rt (id) on delete cascade,
    year             integer     not null,
    total_amount     bigint      not null,
    status           text        not null default 'pending',
    proof_url        text,
    approved_at      timestamptz,
    rejected_at      timestamptz,
    rejection_reason text,
    created_at       timestamptz not null default now()
);


/* ----------------------------------------------------------------------------
 * TABLE: confirmation_details
 * Monthly breakdown of a payment confirmation (normalised).
 * --------------------------------------------------------------------------- */

create table confirmation_details (
    id              uuid        primary key default gen_random_uuid(),
    confirmation_id uuid        not null references payment_confirmations (id) on delete cascade,
    resident_id     uuid        not null references residents (id) on delete cascade,
    year            integer     not null,
    month           integer     not null,
    amount          bigint      not null,
    created_at      timestamptz not null default now()
);


/* ----------------------------------------------------------------------------
 * TABLE: payments
 * Approved payment record (kas masuk). Created by approve_konfirmasi().
 * --------------------------------------------------------------------------- */

create table payments (
    id           uuid        primary key default gen_random_uuid(),
    resident_id  uuid        not null references residents (id) on delete cascade,
    rt_id        uuid        not null references rt (id) on delete cascade,
    year         integer     not null,
    date         timestamptz not null default now(),
    total_amount bigint      not null,
    method       text,
    notes        text,
    created_at   timestamptz not null default now()
);


/* ----------------------------------------------------------------------------
 * TABLE: payment_details
 * Monthly breakdown of an approved payment (normalised).
 * --------------------------------------------------------------------------- */

create table payment_details (
    id          uuid        primary key default gen_random_uuid(),
    payment_id  uuid        not null references payments (id) on delete cascade,
    resident_id uuid        not null references residents (id) on delete cascade,
    year        integer     not null,
    month       integer     not null,
    amount      bigint      not null,
    created_at  timestamptz not null default now()
);

/*
 * =============================================================================
 * Predefined expense categories for RT/RW financial management.
 * =============================================================================
 */

create table expense_categories (
    id         serial      primary key,
    name       text        not null unique,
    sort_order smallint    not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz,
    updated_by uuid        references users (id),
    deleted_at timestamptz,
    deleted_by uuid        references users (id)
);

insert into expense_categories (name, sort_order) values
    ('Keamanan',             1),
    ('Kebersihan',           2),
    ('Perawatan Lingkungan', 3),
    ('Administrasi',         4),
    ('Operasional Pengurus', 5),
    ('Kegiatan Warga',       6),
    ('Sosial & Bantuan',     7),
    ('Utilitas',             8),
    ('Inventaris',           9),
    ('Biaya Bank',          10),
    ('Dana Darurat',        11),
    ('Lain-lain',           12)
    on conflict (name) do nothing;


/* ----------------------------------------------------------------------------
 * TABLE: expenses
 * Expense records (kas keluar).
 * --------------------------------------------------------------------------- */

create table expenses (
    id               uuid        primary key default gen_random_uuid(),
    rt_id            uuid        not null references rt (id) on delete cascade,
    receipt_number   text,
    date             date,
    category         text,
    amount           integer,
    recipient        text,
    description      text,
    receipt_url      text,
    active           boolean     not null default true,
    status           text        not null default 'pending',
    created_by       uuid,
    approved_by      uuid,
    approved_at      timestamptz,
    rejection_note   text,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz,
    updated_by       uuid        references users (id),
    deleted_at       timestamptz,
    deleted_by       uuid        references users (id)
);


/* ----------------------------------------------------------------------------
 * TABLE: ledger
 * Running balance ledger per RT (double-entry style).
 * --------------------------------------------------------------------------- */

create table ledger (
    id            uuid        primary key default gen_random_uuid(),
    rt_id         uuid        not null references rt (id) on delete restrict,
    type          varchar(20) not null,
    source        varchar(50) not null,
    reference_id  uuid,
    date          timestamptz not null default now(),
    description   text,
    amount        bigint      not null default 0,
    balance_after bigint      not null default 0,
    created_by    uuid,
    created_at    timestamptz not null default now(),
    active        boolean     not null default true
);
