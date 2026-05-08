-- bukti pembayaran
insert
	into
	"storage"."buckets" (
  "id",
	"name",
	"created_at",
	"public",
	"avif_autodetection",
	"file_size_limit",
	"allowed_mime_types",
	"type"
)
values (
  'bukti-pembayaran', 
  'bukti-pembayaran', 
  now(), 
  true, 
  false, 
  5242880, 
  array['image/jpeg',
'image/png',
'application/pdf'], 
  'STANDARD'
);

create POLICY "upload bukti pembayaran" on
"storage"."objects" rename to "upload bukti pembayaran";
-- nota pengeluaran
insert
	into
	"storage"."buckets" (
  "id",
	"name",
	"created_at",
	"public",
	"avif_autodetection",
	"file_size_limit",
	"allowed_mime_types",
	"type"
)
values (
  'nota-pengeluaran', 
  'nota-pengeluaran',  
  now(), 
  true, 
  false, 
  5242880, 
  array['image/jpeg',
'image/png',
'application/pdf'], 
  'STANDARD'
);