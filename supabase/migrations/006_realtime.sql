-- konfirmasi_pembayaran
alter publication supabase_realtime
add table konfirmasi_pembayaran;
-- pembayaran
alter publication supabase_realtime
add table pembayaran;
-- pengeluaran
alter publication supabase_realtime
add table pengeluaran;
-- ledger
alter publication supabase_realtime
add table ledger;
-- notifications
alter publication supabase_realtime
add table notifications;
alter table notifications
replica identity full;
-- warga
alter publication supabase_realtime
add table warga;
-- activity
alter publication supabase_realtime
add table activity_logs;