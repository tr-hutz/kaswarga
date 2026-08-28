/*
 * =============================================================================
 * 000_FOUNDATION
 * Core types and identity tables. Every other migration depends on these.
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * ENUM: user_role
 * --------------------------------------------------------------------------- */

create type user_role as enum (
    'SUPER_ADMIN',
    'CHAIR',
    'ADMIN',
    'TREASURER',
    'RESIDENT'
);


/* ----------------------------------------------------------------------------
 * TABLE: rt
 * Profile, contact, and bank information for each RT.
 * --------------------------------------------------------------------------- */

create table rt (
    id             uuid        primary key default gen_random_uuid(),
    name           text        not null,
    code           text        unique,
    address        text,
    city           text,
    province       text,
    postal_code    text,
    email          text,
    phone          text,
    monthly_fee    numeric     not null default 0,
    bank_name      text,
    account_number text,
    account_holder text,
    qris_url       text,
    logo_url       text,
    active                boolean     not null default true,
    maker_checker_enabled boolean     not null default true,
    deleted_at            timestamptz,
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now()
);


/* ----------------------------------------------------------------------------
 * TABLE: users
 * Public user profile that mirrors auth.users.
 * The id must match the corresponding auth.users.id.
 * --------------------------------------------------------------------------- */

create table users (
    id         uuid        primary key,
    name       text,
    email      text,
    created_at timestamptz not null default now(),
    updated_at timestamptz,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid
);


/* ----------------------------------------------------------------------------
 * TABLE: residents
 * Resident record linked to an RT.
 * --------------------------------------------------------------------------- */

create table residents (
    id           uuid        primary key default gen_random_uuid(),
    rt_id        uuid        not null references rt (id) on delete cascade,
    name         text        not null,
    block        text,
    house_number text,
    email        text,
    phone        text,
    active       boolean     not null default true,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz,
    updated_by   uuid        references users (id),
    deleted_at   timestamptz,
    deleted_by   uuid        references users (id)
);


/* ----------------------------------------------------------------------------
 * TABLE: memberships
 * Links an auth user to an RT with a specific role.
 * rt_id is nullable for SUPER_ADMIN who operates at system level.
 * --------------------------------------------------------------------------- */

create table memberships (
    id          uuid        primary key default gen_random_uuid(),
    user_id     uuid        not null references users (id) on delete cascade,
    rt_id       uuid        references rt (id) on delete cascade,
    resident_id uuid        references residents (id) on delete set null,
    role        user_role   not null,
    status      text        not null default 'active'
                            check (status in ('active', 'deactivated')),
    created_at  timestamptz not null default now(),

    unique (user_id, rt_id)
);
