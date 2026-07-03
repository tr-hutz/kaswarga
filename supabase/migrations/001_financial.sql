/*
 * =============================================================================
 * 001_FINANCIAL
 * Payment confirmation, approved payment, expense, and ledger tables.
 * Depends on: 000_foundation (rt, warga)
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * TABLE: konfirmasi_pembayaran
 * A warga submits this record as proof of payment, pending admin approval.
 * --------------------------------------------------------------------------- */

create table konfirmasi_pembayaran (
    id               uuid        primary key default gen_random_uuid(),
    warga_id         uuid        not null references warga (id) on delete cascade,
    rt_id            uuid        not null references rt (id) on delete cascade,
    tahun            integer     not null,
    total_bayar      bigint      not null,
    status           text        not null default 'pending',
    bukti_url        text,
    approved_at      timestamptz,
    rejected_at      timestamptz,
    alasan_penolakan text,
    created_at       timestamptz not null default now()
);


/* ----------------------------------------------------------------------------
 * TABLE: detail_konfirmasi_pembayaran
 * Monthly breakdown of a payment confirmation (normalised).
 * --------------------------------------------------------------------------- */

create table detail_konfirmasi_pembayaran (
    id            uuid        primary key default gen_random_uuid(),
    konfirmasi_id uuid        not null references konfirmasi_pembayaran (id) on delete cascade,
    warga_id      uuid        not null references warga (id) on delete cascade,
    tahun         integer     not null,
    bulan         integer     not null,
    nominal       bigint      not null,
    created_at    timestamptz not null default now()
);


/* ----------------------------------------------------------------------------
 * TABLE: pembayaran
 * Approved payment record (kas masuk). Created by approve_konfirmasi().
 * --------------------------------------------------------------------------- */

create table pembayaran (
    id           uuid        primary key default gen_random_uuid(),
    warga_id     uuid        not null references warga (id) on delete cascade,
    rt_id        uuid        not null references rt (id) on delete cascade,
    tahun        integer     not null,
    tanggal      timestamptz not null default now(),
    jumlah_bayar bigint      not null,
    metode       text,
    keterangan   text,
    created_at   timestamptz not null default now()
);


/* ----------------------------------------------------------------------------
 * TABLE: detail_pembayaran
 * Monthly breakdown of an approved payment (normalised).
 * --------------------------------------------------------------------------- */

create table detail_pembayaran (
    id            uuid        primary key default gen_random_uuid(),
    pembayaran_id uuid        not null references pembayaran (id) on delete cascade,
    warga_id      uuid        not null references warga (id) on delete cascade,
    tahun         integer     not null,
    bulan         integer     not null,
    nominal       bigint      not null,
    created_at    timestamptz not null default now()
);


/* ----------------------------------------------------------------------------
 * TABLE: pengeluaran
 * Expense records (kas keluar).
 * --------------------------------------------------------------------------- */

create table pengeluaran (

    id           uuid        primary key default gen_random_uuid(),
    rt_id        uuid        not null references rt (id) on delete cascade,
    nomor_bukti  text,
    tanggal      date,
    kategori     text,
    nominal      integer,
    penerima     text,
    deskripsi    text,
    nota_url              text,
    aktif                 boolean     not null default true,
    status                text        not null default 'pending',
    created_by            uuid,
    approved_by           uuid,
    approved_at           timestamptz,
    catatan_penolakan     text,
    created_at            timestamptz not null default now()
);


/* ----------------------------------------------------------------------------
 * TABLE: ledger
 * Running balance ledger per RT (double-entry style).
 * --------------------------------------------------------------------------- */

create table ledger (
    id            uuid        primary key default gen_random_uuid(),
    rt_id         uuid        not null references rt (id) on delete restrict,
    jenis         varchar(20) not null,
    sumber        varchar(50) not null,
    referensi_id  uuid,
    tanggal       timestamptz not null default now(),
    deskripsi     text,
    nominal       bigint      not null default 0,
    saldo_setelah bigint      not null default 0,
    created_by    uuid,
    created_at    timestamptz not null default now(),
    aktif         boolean     not null default true
);
