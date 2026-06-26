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
    'super_admin',
    'ketua',
    'admin',
    'bendahara',
    'warga'
);


/* ----------------------------------------------------------------------------
 * TABLE: rt
 * Profile, contact, and bank information for each RT.
 * --------------------------------------------------------------------------- */

create table rt (
    id             uuid        primary key default gen_random_uuid(),
    nama           text        not null,
    kode           text        unique,
    alamat         text,
    kota           text,
    provinsi       text,
    kode_pos       text,
    email          text,
    telepon        text,
    nominal_iuran  numeric     not null default 0,
    nama_bank      text,
    nomor_rekening text,
    atas_nama      text,
    qris_url       text,
    logo_url       text,
    aktif          boolean     not null default true,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);


/* ----------------------------------------------------------------------------
 * TABLE: users
 * Public user profile that mirrors auth.users.
 * The id must match the corresponding auth.users.id.
 * --------------------------------------------------------------------------- */

create table users (
    id         uuid        primary key,
    nama       text,
    email      text,
    created_at timestamptz not null default now()
);


/* ----------------------------------------------------------------------------
 * TABLE: warga
 * Resident record linked to an RT.
 * --------------------------------------------------------------------------- */

create table warga (
    id         uuid        primary key default gen_random_uuid(),
    rt_id      uuid        not null references rt (id) on delete cascade,
    nama       text        not null,
    blok       text,
    no_rumah   text,
    email      text,
    no_hp      text,
    aktif      boolean     not null default true,
    created_at timestamptz not null default now()
);


/* ----------------------------------------------------------------------------
 * TABLE: user_membership
 * Links an auth user to an RT with a specific role.
 * rt_id is nullable for super_admin who operates at system level.
 * --------------------------------------------------------------------------- */

create table user_membership (
    id         uuid        primary key default gen_random_uuid(),
    user_id    uuid        not null references users (id) on delete cascade,
    rt_id      uuid        references rt (id) on delete cascade,
    warga_id   uuid        references warga (id) on delete set null,
    role       user_role   not null,
    created_at timestamptz not null default now(),

    unique (user_id, rt_id)
);
