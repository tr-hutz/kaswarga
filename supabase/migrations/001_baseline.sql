-- profil rt
create table rt
(

    id             uuid primary key
                                 default gen_random_uuid(),

    /*
     |--------------------------------------------------------------------------
     | IDENTITAS RT
     |--------------------------------------------------------------------------
     */
    nama           text not null,
    kode           text unique,
    alamat         text,
    kota           text,
    provinsi       text,
    kode_pos       text,

    email          text,
    telepon        text,

    nominal_iuran  numeric
                        not null default 0,

    nama_bank      text,
    nomor_rekening text,
    atas_nama      text,
    qris_url       text,
    logo_url       text,

    aktif          boolean
                                 default true,

    created_at     timestamptz
                                 default now(),

    updated_at     timestamptz
                                 default now()
);

-- tabel warga
create table warga
(

    id         uuid primary key
        default gen_random_uuid(),

    rt_id      uuid
                    not null
        references rt (id),
    nama       text not null,
    blok       text,
    no_rumah   text,
    email      text,
    no_hp      text,
    aktif      boolean,
    created_at timestamptz
        default now()

);
-- tabel user (login)
create table users
(
    id         uuid primary key,
    nama       text,
    email      text,
    created_at timestamptz
        default now()
);

create type user_role as enum (
  'admin',
  'bendahara',
  'warga'
);

create table user_membership
(
    id         uuid primary key
        default gen_random_uuid(),
    user_id    uuid
        not null
        references users (id),
    rt_id      uuid
        not null
        references rt (id),

    warga_id   uuid
        references warga (id),
    role       user_role
        not null,
    created_at timestamptz
        default now(),
    unique (user_id, rt_id)
);

-- tabel konfirmasi pembayaran
create table konfirmasi_pembayaran
(
    id               uuid primary key   default gen_random_uuid(),

    warga_id         uuid      not null references warga (id) on delete cascade,
    rt_id            uuid      not null references rt (id) on delete cascade,
    tahun            integer   not null,
    total_bayar      bigint    not null,
    status           text      not null default 'pending',
    bukti_url        text,
    approved_at      timestamptz,
    rejected_at      timestamptz,
    alasan_penolakan text,
    created_at       timestamptz not null
                                        default now()
);
-- detail konfirmasi (normalisasi)
create table detail_konfirmasi_pembayaran
(
    id            uuid primary key default gen_random_uuid(),

    konfirmasi_id uuid      not null
        references konfirmasi_pembayaran (id)
            on
                delete
                cascade,
    warga_id      uuid      not null
        references warga (id)
            on
                delete
                cascade,
    tahun         integer   not null,
    bulan         integer   not null,
    nominal       bigint    not null,
    created_at    timestamptz not null
                                   default now(),
    constraint detail_konfirmasi_bulan_check
        check (
            bulan between 1 and 12
            ),
    constraint detail_konfirmasi_unique
        unique (
                warga_id,
                tahun,
                bulan
            )
);
-- tabel pembayaran (kas masuk)
create table pembayaran
(
    id           uuid primary key default gen_random_uuid(),

    warga_id     uuid      not null references warga (id) on delete cascade,

    rt_id        uuid      not null references rt (id) on delete cascade,

    tahun        integer   not null,
    tanggal      timestamptz not null
                                  default now(),
    jumlah_bayar bigint    not null,
    metode       text,
    keterangan   text,
    created_at   timestamptz not null
                                  default now()
);
-- detail (normalisasi)
create table detail_pembayaran
(
    id            uuid primary key default gen_random_uuid(),

    pembayaran_id uuid      not null
        references pembayaran (id)
            on
                delete
                cascade,
    warga_id      uuid      not null
        references warga (id)
            on
                delete
                cascade,
    tahun         integer   not null,
    bulan         integer   not null,
    nominal       bigint    not null,
    created_at    timestamptz not null
                                   default now(),
    constraint detail_bulan_check
        check (
            bulan between 1 and 12
            ),
    constraint detail_nominal_check
        check (
            nominal >= 0
            ),
    constraint detail_unique_bulan
        unique (
                warga_id,
                tahun,
                bulan
            )
);
-- tabel pengeluaran (kas keluar)
create table pengeluaran
(
    id         UUID primary key default gen_random_uuid(),
    rt_id      uuid not null
        references rt (id)
            on
                delete
                cascade,
    tanggal    DATE,
    kategori   TEXT,
    nominal    INTEGER,
    deskripsi  TEXT,
    nota_url   TEXT,
    aktif      BOOL             DEFAULT TRUE,
    created_at timestamptz        default Now()
);

-- tabel ledger (pencatatan uang masuk - keluar)
create table ledger
(
    id            uuid primary key
                                       default gen_random_uuid(),

    rt_id         uuid        not null references rt (id)
        on
            delete
            restrict,
    jenis         varchar(20)
                              not null,

    sumber        varchar(50) not null,
    referensi_id  uuid,
    tanggal       timestamptz   not null default now(),
    deskripsi     text,
    nominal       bigint      not null default 0,

    saldo_setelah bigint      not null default 0,

    created_by    uuid,
    created_at    timestamptz
                                       default now(),

    aktif         boolean              default true
);

-- table notifications
create table notifications
(
    id             uuid primary key
        default gen_random_uuid(),

    rt_id          uuid not null
        references rt (id)
            on delete cascade,

    type           varchar(50)
                        not null,

    title          text
                        not null,

    message        text,

    entity_type    varchar(50),

    entity_id      uuid,

    target_role    varchar(50),

    target_user_id uuid,

    is_read        boolean
        default false,

    created_at     timestamptz
        default now()
);

create table activity_logs
(

    id          uuid primary key
        default gen_random_uuid(),

    rt_id       uuid not null
        references rt (id)
            on delete cascade,

    actor_id    uuid,

    actor_name  text,

    action      varchar(100)
                     not null,

    entity_type varchar(50)
                     not null,

    entity_id   uuid,

    description text,

    visibility varchar(50)
        default 'internal',

    metadata    jsonb,

    created_at  timestamptz
        default now()
);