-- cek status 
alter table konfirmasi_pembayaran
    add constraint status_check
        check (status in ('pending', 'processing', 'approved', 'rejected'));
-- cek total bayar konfirmasi
alter table konfirmasi_pembayaran
    add constraint total_bayar_check
        check (total_bayar > 0);
-- cek nominal detail konfirmasi
alter table detail_konfirmasi_pembayaran
    add constraint nominal_check
        check (nominal > 0);
-- opsional
alter table konfirmasi_pembayaran
    add constraint konfirmasi_tahun_check
        check (
            tahun >= 2020
                and tahun <= 2100
            );
-- cek total bayar
alter table pembayaran
    add constraint total_bayar_check
        check (total_bayar > 0);
-- cek nominal detail
alter table detail_pembayaran
    add constraint nominal_check
        check (nominal > 0);
-- opsional
alter table pembayaran
    add constraint pembayaran_tahun_check
        check (
            tahun >= 2020
                and tahun <= 2100
            );
-- constraint check in pengeluaran
alter table pengeluaran
    add constraint pengeluaran_nominal_check
        check (nominal > 0);
-- for approval
alter table konfirmasi_pembayaran
    add column approved_at timestamp;
-- for rejected
alter table konfirmasi_pembayaran
    add column rejected_at timestamp;
-- for reason of rejected
alter table konfirmasi_pembayaran
    add column alasan_penolakan text;
-- for ledger
create index idx_ledger_rt
    on ledger(rt_id);
create index idx_ledger_tanggal
    on ledger(tanggal);
create index idx_ledger_sumber
    on ledger(sumber);
create index idx_ledger_referensi
    on ledger(referensi_id);