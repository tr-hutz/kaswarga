/*
 * =============================================================================
 * 004_CONSTRAINTS
 * Check constraints and indexes across all tables.
 * Depends on: 001_financial, 002_communication
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * KONFIRMASI PEMBAYARAN
 * --------------------------------------------------------------------------- */

alter table konfirmasi_pembayaran
    add constraint konfirmasi_status_check
        check (status in ('pending', 'processing', 'approved', 'rejected'));

alter table konfirmasi_pembayaran
    add constraint konfirmasi_total_bayar_check
        check (total_bayar > 0);

alter table konfirmasi_pembayaran
    add constraint konfirmasi_tahun_check
        check (tahun >= 2020 and tahun <= 2100);


/* ----------------------------------------------------------------------------
 * DETAIL KONFIRMASI PEMBAYARAN
 * --------------------------------------------------------------------------- */

alter table detail_konfirmasi_pembayaran
    add constraint detail_konfirmasi_bulan_check
        check (bulan between 1 and 12);

alter table detail_konfirmasi_pembayaran
    add constraint detail_konfirmasi_nominal_check
        check (nominal > 0);

-- NOTE: no unique constraint on (warga_id, tahun, bulan) here intentionally.
-- A warga must be able to resubmit after rejection, so drafts are allowed to
-- repeat a month.  The uniqueness constraint on detail_pembayaran (approved
-- payments) still prevents double-approval for the same period.


/* ----------------------------------------------------------------------------
 * PEMBAYARAN
 * --------------------------------------------------------------------------- */

alter table pembayaran
    add constraint pembayaran_jumlah_bayar_check
        check (jumlah_bayar > 0);

alter table pembayaran
    add constraint pembayaran_tahun_check
        check (tahun >= 2020 and tahun <= 2100);


/* ----------------------------------------------------------------------------
 * DETAIL PEMBAYARAN
 * --------------------------------------------------------------------------- */

alter table detail_pembayaran
    add constraint detail_pembayaran_bulan_check
        check (bulan between 1 and 12);

alter table detail_pembayaran
    add constraint detail_pembayaran_nominal_check
        check (nominal >= 0);

alter table detail_pembayaran
    add constraint detail_pembayaran_unique
        unique (warga_id, tahun, bulan);


/* ----------------------------------------------------------------------------
 * PENGELUARAN
 * --------------------------------------------------------------------------- */

alter table pengeluaran
    add constraint pengeluaran_nominal_check
        check (nominal > 0);


/* ----------------------------------------------------------------------------
 * INDEXES — LEDGER
 * --------------------------------------------------------------------------- */

create index idx_ledger_rt          on ledger (rt_id);
create index idx_ledger_tanggal     on ledger (tanggal);
create index idx_ledger_sumber      on ledger (sumber);
create index idx_ledger_referensi   on ledger (referensi_id);


/* ----------------------------------------------------------------------------
 * INDEXES — NOTIFICATIONS
 * --------------------------------------------------------------------------- */

create index idx_notifications_rt           on notifications (rt_id);
create index idx_notifications_target_user  on notifications (target_user_id);
create index idx_notifications_unread       on notifications (is_read);
create index idx_notifications_created_at   on notifications (created_at desc);


/* ----------------------------------------------------------------------------
 * INDEXES — RLS query support
 * Each index prevents a full table scan per row evaluated by the RT-scoped
 * RLS policies defined in 007_rls.sql.
 * --------------------------------------------------------------------------- */

-- user_membership: RLS helper functions scan by user_id
create index idx_user_membership_user_id
    on user_membership (user_id);

-- Core data tables: scanned by rt_id in RLS predicates
create index idx_warga_rt_id
    on warga (rt_id);

create index idx_konfirmasi_rt_id
    on konfirmasi_pembayaran (rt_id);

create index idx_pembayaran_rt_id
    on pembayaran (rt_id);

create index idx_pengeluaran_rt_id
    on pengeluaran (rt_id);

create index idx_activity_logs_rt_id
    on activity_logs (rt_id);

-- Detail tables: scanned by parent FK in RLS subquery
create index idx_detail_konfirmasi_konfirmasi_id
    on detail_konfirmasi_pembayaran (konfirmasi_id);

create index idx_detail_pembayaran_pembayaran_id
    on detail_pembayaran (pembayaran_id);
