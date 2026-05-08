-- profil rt
create table profil_rt(id UUID primary key default gen_random_uuid(),
                       nama_rt TEXT,
                       nama_perumahan TEXT,
                       alamat TEXT,
                       iuran_per_bulan numeric,
                       nama_ketua TEXT,
                       nama_bendahara TEXT, 
                       nama_bank TEXT,
                       nomor_rekening TEXT,
                       nama_rekening TEXT,
                       logo_url TEXT,
                       created_at TIMESTAMP default Now());
-- tabel warga
create table warga(id UUID primary key default gen_random_uuid(),
                   nama TEXT not null,
                   blok TEXT,
                   no_rumah TEXT,
                   email TEXT,
                   created_at TIMESTAMP default Now());
-- tabel user (login)
create type user_role as ENUM ('admin',
'bendahara',
'warga');

create table users(id UUID primary key,
                   nama TEXT,
                   role TEXT check (role in ('admin', 'bendahara', 'warga')),
                   warga_id UUID references warga(id),
                   created_at TIMESTAMP default Now());

-- tabel konfirmasi pembayaran
create table konfirmasi_pembayaran (
  id uuid primary key default gen_random_uuid(),

  warga_id uuid not null
    references warga(id)
    on
delete
	cascade,
	tahun integer not null,
	total_bayar bigint not null,
	status text not null default 'pending',
	bukti_url text,
	created_at timestamp not null
    default now()
);
-- detail konfirmasi (normalisasi)
create table detail_konfirmasi_pembayaran (
  id uuid primary key default gen_random_uuid(),

  konfirmasi_id uuid not null
    references konfirmasi_pembayaran(id)
    on
delete
	cascade,
	warga_id uuid not null
    references warga(id)
    on
	delete
		cascade,
		tahun integer not null,
		bulan integer not null,
		nominal bigint not null,
		created_at timestamp not null
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
create table pembayaran (
  id uuid primary key default gen_random_uuid(),

  warga_id uuid not null
    references warga(id)
    on
delete
	cascade,
	tahun integer not null,
	tanggal timestamp not null
    default now(),
	jumlah_bayar bigint not null,
	metode text,
	keterangan text,
	created_at timestamp not null
    default now()
);
-- detail (normalisasi)
create table detail_pembayaran (
  id uuid primary key default gen_random_uuid(),

  pembayaran_id uuid not null
    references pembayaran(id)
    on
delete
	cascade,
	warga_id uuid not null
    references warga(id)
    on
	delete
		cascade,
		tahun integer not null,
		bulan integer not null,
		nominal bigint not null,
		created_at timestamp not null
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
create table pengeluaran(id UUID primary key default gen_random_uuid(),
                         tanggal DATE,
                         kategori TEXT,
                         nominal INTEGER,
                         deskripsi TEXT,
                         nota_url TEXT,
                         created_at TIMESTAMP default Now());
