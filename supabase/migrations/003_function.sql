/*
|--------------------------------------------------------------------------
| APPROVE KONFIRMASI PEMBAYARAN
|--------------------------------------------------------------------------
|
| Flow:
| 1. Lock row konfirmasi
| 2. Pastikan status masih pending
| 3. Insert pembayaran (header)
| 4. Copy detail bulan ke detail_pembayaran
| 5. Update status approved
|
*/
create or replace function approve_konfirmasi(
    p_konfirmasi_id uuid,
    p_user_id uuid
)
returns void
language plpgsql
security definer
as $$

declare v_konfirmasi  record;
        v_warga        record;
        v_pembayaran_id uuid;
        v_nominal_iuran bigint;
        v_jumlah_bulan  integer;
        v_expected_total bigint;
        v_bulan_str     text;
        v_bulan_names   text[] := ARRAY[
            'Januari','Februari','Maret','April','Mei','Juni',
            'Juli','Agustus','September','Oktober','November','Desember'
        ];

begin

  /*
  |--------------------------------------------------------------------------
  | LOCK KONFIRMASI
  |--------------------------------------------------------------------------
  */

  select *
  into v_konfirmasi
  from konfirmasi_pembayaran
  where id = p_konfirmasi_id
  for update;

  /*
  |--------------------------------------------------------------------------
  | VALIDASI
  |--------------------------------------------------------------------------
  */
  if not found then
      RAISE EXCEPTION 'Konfirmasi pembayaran tidak ditemukan'
        USING ERRCODE = 'KW001';
  end if;

  if v_konfirmasi.status != 'pending' then
      RAISE EXCEPTION 'Konfirmasi sudah diproses'
        USING ERRCODE = 'KW002';
  end if;

  select *
  into v_warga
  from user_membership
  where warga_id = v_konfirmasi.warga_id;

  /*
  |--------------------------------------------------------------------------
  | VALIDASI BULAN SUDAH DIBAYAR
  |--------------------------------------------------------------------------
  */

  if exists (
    select 1
    from detail_pembayaran dp
    join detail_konfirmasi_pembayaran dkp
      on dkp.konfirmasi_id = p_konfirmasi_id
    where dp.warga_id = v_konfirmasi.warga_id
      and dp.tahun     = v_konfirmasi.tahun
      and dp.bulan     = dkp.bulan
  ) then
    RAISE EXCEPTION 'Beberapa bulan yang dikonfirmasi sudah memiliki data pembayaran yang disetujui'
      USING ERRCODE = 'KW003';
  end if;

  /*
  |--------------------------------------------------------------------------
  | VALIDASI TOTAL BAYAR
  |--------------------------------------------------------------------------
  */

  select nominal_iuran
  into v_nominal_iuran
  from rt
  where id = v_konfirmasi.rt_id;

  select count(*)
  into v_jumlah_bulan
  from detail_konfirmasi_pembayaran
  where konfirmasi_id = p_konfirmasi_id;

  v_expected_total := v_nominal_iuran * v_jumlah_bulan;

  if v_konfirmasi.total_bayar > v_expected_total then
    RAISE EXCEPTION 'Total pembayaran (%) melebihi jumlah yang seharusnya (% x % bulan = %). Selisih: %',
      v_konfirmasi.total_bayar,
      v_nominal_iuran,
      v_jumlah_bulan,
      v_expected_total,
      (v_konfirmasi.total_bayar - v_expected_total)
      USING ERRCODE = 'KW004';
  end if;

  if v_konfirmasi.total_bayar < v_expected_total then
    RAISE EXCEPTION 'Total pembayaran (%) kurang dari jumlah yang seharusnya (% x % bulan = %). Selisih: %',
      v_konfirmasi.total_bayar,
      v_nominal_iuran,
      v_jumlah_bulan,
      v_expected_total,
      (v_expected_total - v_konfirmasi.total_bayar)
      USING ERRCODE = 'KW005';
  end if;

  /*
  |--------------------------------------------------------------------------
  | INSERT HEADER PEMBAYARAN
  |--------------------------------------------------------------------------
   */

  insert into pembayaran (
    warga_id,
    rt_id,
    tahun,
    jumlah_bayar,
    tanggal,
    created_at
  ) values (
    v_konfirmasi.warga_id,
    v_konfirmasi.rt_id,
    v_konfirmasi.tahun,
    v_konfirmasi.total_bayar,
    now(),
    now()
  )
  RETURNING id into v_pembayaran_id;

  /*
  |--------------------------------------------------------------------------
  | COPY DETAIL BULAN
  |--------------------------------------------------------------------------
  */

  insert into
    detail_pembayaran (
    pembayaran_id,
    warga_id,
    tahun,
    bulan,
    nominal,
    created_at
  ) select
    v_pembayaran_id,
    d.warga_id,
    d.tahun,
    d.bulan,
    d.nominal,
    now()
  from
    detail_konfirmasi_pembayaran d
  where
    d.konfirmasi_id = p_konfirmasi_id;

/*
   |--------------------------------------------------------------------------
   | UPDATE STATUS KONFIRMASI
   |--------------------------------------------------------------------------
   */

  update
    konfirmasi_pembayaran
  set
    status = 'approved',
    approved_at = now()
  where
    id = p_konfirmasi_id;

  perform insert_ledger(
    v_konfirmasi.rt_id,
    'pemasukan',
    'pembayaran',
    v_pembayaran_id,
    now(),
    'Pembayaran iuran warga',
    v_konfirmasi.total_bayar,
    p_user_id
  );

   /*
   |--------------------------------------------------------------------------
   | INSERT NOTIFICATION
   |--------------------------------------------------------------------------
   */

  select string_agg(v_bulan_names[bulan], ', ' order by bulan)
  into v_bulan_str
  from detail_konfirmasi_pembayaran
  where konfirmasi_id = p_konfirmasi_id;

    insert into notifications (
      rt_id,
      type,
      title,
      message,
      entity_type,
      entity_id,
      target_user_id
    ) values (
      v_konfirmasi.rt_id,
      'payment_approved',
      'Pembayaran Disetujui',
      'Pembayaran iuran ' || v_bulan_str || ' ' || v_konfirmasi.tahun || ' telah disetujui',
      'konfirmasi_pembayaran',
      v_konfirmasi.id,
      v_warga.user_id
    );

end;

$$;

/*
|--------------------------------------------------------------------------
| REJECT KONFIRMASI PEMBAYARAN
|--------------------------------------------------------------------------
|
| Flow:
| 1. Lock row konfirmasi
| 2. Pastikan status masih pending
| 3. Update status rejected
| 4. Simpan alasan penolakan
|
*/

create or REPLACE function reject_konfirmasi(
  p_konfirmasi_id uuid,
  p_alasan text,
  p_user_id uuid
)
returns void
language plpgsql
security definer
as $$
declare v_konfirmasi  record;
        v_warga       record;
        v_bulan_str   text;
        v_bulan_names text[] := ARRAY[
            'Januari','Februari','Maret','April','Mei','Juni',
            'Juli','Agustus','September','Oktober','November','Desember'
        ];

begin

  /*
   |--------------------------------------------------------------------------
   | LOCK KONFIRMASI
   |--------------------------------------------------------------------------
   */

  select * into
	v_konfirmasi
  from
	konfirmasi_pembayaran
  where
	id = p_konfirmasi_id
  for update;

  select *
  into v_warga
  from user_membership
  where warga_id = v_konfirmasi.warga_id;
	
   /*
   |--------------------------------------------------------------------------
   | VALIDASI
   |--------------------------------------------------------------------------
   */
	if not found then
      RAISE EXCEPTION 'Konfirmasi pembayaran tidak ditemukan'
        USING ERRCODE = 'KW001';
    end if;

    if v_konfirmasi.status != 'pending' then
        RAISE EXCEPTION 'Konfirmasi sudah diproses'
          USING ERRCODE = 'KW002';
    end if;

   /*
   |--------------------------------------------------------------------------
   | UPDATE STATUS
   |--------------------------------------------------------------------------
   */

  update
	konfirmasi_pembayaran
  set
	status = 'rejected',
	rejected_at = now(),
	alasan_penolakan = p_alasan
  where
	id = p_konfirmasi_id;

   /*
   |--------------------------------------------------------------------------
   | INSERT NOTIFICATION
   |--------------------------------------------------------------------------
   */

  select string_agg(v_bulan_names[bulan], ', ' order by bulan)
  into v_bulan_str
  from detail_konfirmasi_pembayaran
  where konfirmasi_id = p_konfirmasi_id;

    insert into notifications (
      rt_id,
      type,
      title,
      message,
      entity_type,
      entity_id,
      target_user_id
    ) values (
      v_konfirmasi.rt_id,
      'payment_rejected',
      'Pembayaran Ditolak',
      'Pembayaran iuran ' || v_bulan_str || ' ' || v_konfirmasi.tahun || ' ditolak' ||
        case when p_alasan is not null and p_alasan != ''
             then '. Alasan: ' || p_alasan
             else ''
        end,
      'konfirmasi_pembayaran',
      v_konfirmasi.id,
      v_warga.user_id
    );

end;

$$;

-- Access permission
revoke all
on
function approve_konfirmasi(uuid, uuid)
from
PUBLIC;

revoke all
on
function reject_konfirmasi(uuid, text, uuid)
from
PUBLIC;

grant execute
on
function approve_konfirmasi(uuid, uuid)
to authenticated;

grant execute
on
function reject_konfirmasi(uuid, text, uuid)
to authenticated;

-- utilities
-- insert sample data for pembayaran and pengeluaran
-- with ratio cash-in and cash-out
/*
|--------------------------------------------------------------------------
| POPULATE CASHFLOW
|--------------------------------------------------------------------------
|
| Versi NORMALIZED:
| - pembayaran = header
| - detail_pembayaran = detail bulan
|
| Perubahan:
| ✅ insert detail_pembayaran
| ✅ anti duplicate bulan per warga
| ✅ nominal mengikuti rt
| ✅ field pengeluaran disesuaikan
| ✅ reset detail pembayaran
|
*/
create or REPLACE function populate_cashflow(
  p_tahun int,
  p_jumlah_data int default 100,
  p_max_bulan int default 3,
  p_rasio_pengeluaran numeric default 0.8
)
returns void
language plpgsql
as $$
declare

  v_warga_id uuid;

  v_pembayaran_id uuid;

  v_jumlah_bulan int;

  v_rt RECORD;

  v_jumlah_bayar bigint;

  v_total_masuk bigint := 0;

  v_target_pengeluaran bigint;

  v_current_pengeluaran bigint := 0;

  v_kategori text[] := array[
    'sosial',
    'operasional',
    'kebersihan',
    'keamanan',
    'kegiatan'
  ];

  v_deskripsi text[] := array[
    'Bantuan warga sakit',
    'Pembelian alat kebersihan',
    'Konsumsi rapat',
    'Perbaikan fasilitas',
    'Honor keamanan'
  ];

  v_bulan int;

  v_selected_bulan int[] := '{}';

  v_random_bulan int;

  v_tanggal timestamp;

begin

  /*
   |--------------------------------------------------------------------------
   | AMBIL NOMINAL IURAN
   |--------------------------------------------------------------------------
   */

  select
	id,
  nominal_iuran
  into
	v_rt
from
	rt
limit 1;

if v_rt.nominal_iuran is null then
    RAISE exception
      'Nominal iuran pada rt belum diatur';
end if;

/*
   |--------------------------------------------------------------------------
   | HAPUS DATA LAMA
   |--------------------------------------------------------------------------
   */

  delete
from
	detail_pembayaran
where
	tahun = p_tahun;

delete
from
	pembayaran
where
	tahun = p_tahun;

delete
from
	pengeluaran
where
	extract(year from tanggal) = p_tahun;

/*
   |--------------------------------------------------------------------------
   | GENERATE PEMBAYARAN
   |--------------------------------------------------------------------------
   */

  for i in 1.. p_jumlah_data LOOP

    /*
     * RANDOM WARGA
     */
    select
	id
    into
	v_warga_id
from
	warga
order by
	random()
limit 1;

/*
     * RANDOM JUMLAH BULAN
     */
v_jumlah_bulan :=
      floor(
        random() * p_max_bulan + 1
      );

/*
     * RESET ARRAY BULAN
     */
v_selected_bulan := '{}';

/*
     * AMBIL BULAN RANDOM TANPA DUPLIKAT
     */
WHILE array_length(
      v_selected_bulan,
      1
    ) is null
or array_length(
      v_selected_bulan,
      1
    ) < v_jumlah_bulan LOOP

      v_random_bulan :=
        floor(random() * 12 + 1);

if not (
        v_random_bulan =
        any(v_selected_bulan)
      ) then

        /*
         * PASTIKAN BELUM ADA
         * DI detail_pembayaran
         */
        if not exists (
select
	1
from
	detail_pembayaran
where
	warga_id = v_warga_id
	and tahun = p_tahun
	and bulan = v_random_bulan
        ) then

          v_selected_bulan :=
            array_append(
              v_selected_bulan,
              v_random_bulan
            );
end if;
end if;
end LOOP;

/*
     * TOTAL BAYAR
     */
v_jumlah_bayar :=
      v_jumlah_bulan
      * v_rt.nominal_iuran;

/*
     * RANDOM TANGGAL
     */
v_tanggal :=
      now()
      - (
          floor(random() * 120)
          || ' days'
        )::interval;

/*
     * INSERT HEADER PEMBAYARAN
     */
    insert
	into
	pembayaran (
      warga_id,
      rt_id,
      tahun,
      jumlah_bayar,
      tanggal,
      created_at
    )
values (
      v_warga_id,
        v_rt.id,
      p_tahun,
      v_jumlah_bayar,
      v_tanggal,
      now()
    )
    RETURNING id
    into
	v_pembayaran_id;

/*
     * INSERT DETAIL BULAN
     */
FOREACH v_bulan in array v_selected_bulan
    LOOP

      insert into detail_pembayaran (
        pembayaran_id,
        warga_id,
        tahun,
        bulan,
        nominal,
        created_at
      ) values (
        v_pembayaran_id,
        v_warga_id,
        p_tahun,
        v_bulan,
        v_rt.nominal_iuran,
        now()
      );
end LOOP;

/*
     * TOTAL MASUK
     */
v_total_masuk :=
      v_total_masuk
      + v_jumlah_bayar;
end LOOP;

/*
   |--------------------------------------------------------------------------
   | TARGET PENGELUARAN
   |--------------------------------------------------------------------------
   */

v_target_pengeluaran :=
    (
      v_total_masuk
      * p_rasio_pengeluaran
    )::bigint;

/*
   |--------------------------------------------------------------------------
   | GENERATE PENGELUARAN
   |--------------------------------------------------------------------------
   */

WHILE
    v_current_pengeluaran
    < v_target_pengeluaran
  LOOP

    v_jumlah_bayar :=
      (
        floor(random() * 5) + 1
      ) * v_rt.nominal_iuran;

EXIT
when (
      v_current_pengeluaran
      + v_jumlah_bayar
    ) > v_target_pengeluaran;

insert
	into
	pengeluaran (
    rt_id,
    kategori,
    deskripsi,
    nominal,
    tanggal,
    created_at
  ) values (
    v_rt.id,
      v_kategori[
        floor(random() * 5) + 1
      ],

      v_deskripsi[
        floor(random() * 5) + 1
      ],

      v_jumlah_bayar,

      now()
      - (
          floor(random() * 120)
          || ' days'
        )::interval,

      now()
    );

v_current_pengeluaran :=
      v_current_pengeluaran
      + v_jumlah_bayar;
end LOOP;
end;

$$;


/*
   |--------------------------------------------------------------------------
   | GET LAST SALDO
   |--------------------------------------------------------------------------
   */

create or replace function get_last_saldo(
    p_rt_id uuid
)
returns bigint

language plpgsql

as $$

declare v_saldo bigint;

begin

select
    saldo_setelah
into v_saldo
from ledger
where rt_id = p_rt_id
order by tanggal desc
    limit 1;

return coalesce(v_saldo, 0);

end;

$$;


/*
   |--------------------------------------------------------------------------
   | INSERT KAS LEDGER
   |--------------------------------------------------------------------------
   */

create or replace function insert_ledger(
    p_rt_id uuid,
    p_jenis varchar,
    p_sumber varchar,
    p_referensi_id uuid,
    p_tanggal timestamptz,
    p_deskripsi text,
    p_nominal bigint,
    p_created_by uuid
)

returns uuid

language plpgsql

as $$

declare
    v_last_saldo bigint;
    v_new_saldo bigint;

    v_id uuid;

begin

    v_last_saldo :=
        get_last_saldo(
            p_rt_id
        );

    if p_jenis = 'pemasukan' then

        v_new_saldo :=
            v_last_saldo +
            p_nominal;

else

        v_new_saldo :=
            v_last_saldo -
            p_nominal;

end if;

insert into ledger (
    rt_id,
    jenis,
    sumber,
    referensi_id,
    tanggal,
    deskripsi,
    nominal,
    saldo_setelah,
    created_by
) values (
           p_rt_id,
           p_jenis,
           p_sumber,
           p_referensi_id,
           p_tanggal,
           p_deskripsi,
           p_nominal,
           v_new_saldo,
           p_created_by
       )
returning id
into v_id;

return v_id;

end;

$$;

