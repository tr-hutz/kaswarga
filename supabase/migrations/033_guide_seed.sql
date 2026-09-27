/*
 * =============================================================================
 * 033_GUIDE_SEED
 * Pre-populated user guide sections.
 * Safe to re-run — all inserts use ON CONFLICT DO NOTHING.
 * =============================================================================
 */

-- Quick Start ------------------------------------------------------------------

INSERT INTO guide_sections (id, title, body, category, position, is_published) VALUES
(
    '00000001-0000-0000-0000-000000000001',
    'Selamat Datang di KasWarga',
    'KasWarga adalah aplikasi manajemen keuangan dan administrasi untuk Rukun Tetangga (RT). Aplikasi ini membantu pengurus RT mengelola data warga, pencatatan iuran bulanan, pengeluaran RT, serta laporan keuangan secara digital dan transparan.

Dengan KasWarga, bendahara dapat mencatat setiap pembayaran iuran warga, ketua RT dapat memantau kondisi keuangan secara real-time, dan warga dapat melihat riwayat pembayaran mereka sendiri.

Panduan ini akan membantu Anda memahami fitur-fitur utama aplikasi dan cara menggunakannya dengan benar.',
    'quick_start',
    1,
    true
),
(
    '00000001-0000-0000-0000-000000000002',
    'Cara Login',
    'Untuk masuk ke aplikasi KasWarga, buka halaman login di browser Anda. Masukkan alamat email yang telah didaftarkan oleh pengurus RT Anda, lalu masukkan kata sandi Anda.

Klik tombol "Masuk" untuk melanjutkan. Jika email dan kata sandi benar, Anda akan diarahkan ke halaman dasbor utama.

Jika Anda lupa kata sandi, klik tautan "Lupa kata sandi?" di halaman login dan ikuti instruksi yang dikirimkan ke email Anda. Pastikan Anda menggunakan email yang terdaftar di sistem RT Anda.',
    'quick_start',
    2,
    true
),
(
    '00000001-0000-0000-0000-000000000003',
    'Navigasi Dasar',
    'Setelah login, Anda akan melihat sidebar di sisi kiri layar yang berisi menu navigasi utama. Setiap menu membawa Anda ke bagian fitur yang berbeda.

Menu "Dasbor" menampilkan ringkasan kondisi keuangan RT, termasuk saldo saat ini, iuran terbaru, dan pengeluaran terakhir. Menu "Warga" berisi daftar seluruh warga yang terdaftar di RT Anda.

Menu "Pembayaran" digunakan untuk mengelola konfirmasi iuran warga. Menu "Pengeluaran" untuk mencatat dan mengelola pengeluaran RT. Menu "Laporan" menampilkan rekap keuangan dan buku kas. Di bagian atas halaman terdapat tombol profil untuk mengakses pengaturan akun Anda.',
    'quick_start',
    3,
    true
),
(
    '00000001-0000-0000-0000-000000000004',
    'Ubah Kata Sandi',
    'Untuk mengubah kata sandi, klik ikon profil atau nama Anda di bagian atas halaman (topbar). Pilih "Pengaturan" atau "Profil" dari menu yang muncul.

Di halaman pengaturan akun, Anda akan menemukan opsi untuk mengubah kata sandi. Masukkan kata sandi lama Anda untuk verifikasi, kemudian masukkan kata sandi baru dua kali untuk konfirmasi. Klik "Simpan" untuk menyimpan perubahan.

Gunakan kata sandi yang kuat dengan kombinasi huruf besar, huruf kecil, angka, dan simbol agar akun Anda tetap aman.',
    'quick_start',
    4,
    true
)
ON CONFLICT DO NOTHING;


-- Fitur -----------------------------------------------------------------------

INSERT INTO guide_sections (id, title, body, category, position, is_published) VALUES
(
    '00000002-0000-0000-0000-000000000001',
    'Kelola Data Warga',
    'Menu "Warga" menampilkan daftar seluruh warga yang terdaftar di RT Anda beserta informasi seperti nama, alamat, blok dan nomor rumah, serta status keanggotaan.

Untuk menambahkan warga baru, klik tombol "Tambah Warga" di sudut kanan atas, lalu isi formulir dengan data yang diperlukan. Data yang umumnya dibutuhkan meliputi nama lengkap, nomor rumah, blok, dan alamat email jika warga ingin mengakses aplikasi.

Untuk mengedit data warga, klik baris warga yang ingin diubah atau klik ikon edit. Untuk menonaktifkan warga yang sudah pindah, gunakan menu aksi yang tersedia. Data warga yang dinonaktifkan tetap tersimpan untuk keperluan riwayat.',
    'feature',
    1,
    true
),
(
    '00000002-0000-0000-0000-000000000002',
    'Pencatatan Iuran',
    'Fitur pembayaran iuran digunakan untuk mencatat pembayaran bulanan dari warga. Warga atau pengurus dapat mengunggah bukti transfer pembayaran sebagai konfirmasi.

Bendahara dapat melihat daftar konfirmasi pembayaran yang masuk di menu "Pembayaran". Setiap konfirmasi menampilkan nama warga, jumlah, periode bulan yang dibayar, dan bukti transfer yang diunggah.

Untuk menyetujui konfirmasi, klik tombol "Setujui". Sistem secara otomatis akan memperbarui status iuran warga dan mencatat transaksi ke buku kas. Jika bukti tidak valid, gunakan tombol "Tolak" dan berikan alasan penolakan agar warga dapat mengirim ulang.',
    'feature',
    2,
    true
),
(
    '00000002-0000-0000-0000-000000000003',
    'Pencatatan Pengeluaran',
    'Menu "Pengeluaran" digunakan untuk mencatat semua pengeluaran yang dilakukan oleh RT, seperti biaya kebersihan, keamanan, pemeliharaan fasilitas, dan operasional lainnya.

Untuk menambahkan pengeluaran baru, klik tombol "Tambah Pengeluaran", lalu isi formulir dengan kategori, tanggal, jumlah, nama penerima, dan deskripsi singkat. Pengeluaran yang baru dibuat akan berada dalam status "Menunggu Persetujuan".

Ketua RT bertugas meninjau dan menyetujui pengeluaran. Setelah disetujui, saldo kas RT akan otomatis berkurang sesuai jumlah pengeluaran dan transaksi akan tercatat di buku kas. Pengeluaran yang ditolak dapat diperbaiki dan diajukan kembali.',
    'feature',
    3,
    true
),
(
    '00000002-0000-0000-0000-000000000004',
    'Laporan Keuangan',
    'Menu "Laporan" menampilkan ringkasan kondisi keuangan RT secara keseluruhan, termasuk total pemasukan dari iuran, total pengeluaran, dan saldo saat ini.

Buku kas menampilkan seluruh riwayat transaksi secara kronologis, baik pemasukan maupun pengeluaran, lengkap dengan tanggal dan keterangan. Anda dapat memfilter berdasarkan periode bulan dan tahun untuk melihat laporan dalam rentang waktu tertentu.

Laporan juga menampilkan daftar warga yang masih memiliki tunggakan iuran, beserta jumlah bulan yang belum dibayar dan total nominal tunggakan. Fitur ekspor tersedia untuk mengunduh laporan dalam format yang dapat dibagikan kepada pengurus RT.',
    'feature',
    4,
    true
),
(
    '00000002-0000-0000-0000-000000000005',
    'Pengumuman',
    'Fitur pengumuman memungkinkan pengurus RT untuk menyebarkan informasi penting kepada seluruh anggota RT yang terdaftar di aplikasi.

Untuk membuat pengumuman baru, buka menu "Pengumuman" dan klik tombol "Tambah Pengumuman". Isi judul dan isi pengumuman, lalu pilih apakah ingin menerbitkannya segera atau menyimpannya sebagai draft terlebih dahulu.

Pengumuman yang sudah diterbitkan dapat dilihat oleh seluruh anggota RT yang login ke aplikasi. Pengurus dapat mengedit atau menghapus pengumuman kapan saja melalui menu aksi yang tersedia di daftar pengumuman.',
    'feature',
    5,
    true
),
(
    '00000002-0000-0000-0000-000000000006',
    'Manajemen Anggota',
    'Menu "Keanggotaan" atau "Pengguna" memungkinkan pengurus untuk mengelola siapa saja yang memiliki akses ke aplikasi dan dengan peran apa.

Setiap anggota RT dapat memiliki salah satu dari beberapa peran: Warga (akses terbatas untuk melihat data sendiri), Bendahara (mengelola pembayaran dan pengeluaran), Admin RT (mengelola data warga dan keanggotaan), atau Ketua RT (akses penuh dan persetujuan pengeluaran).

Untuk mengubah peran anggota, buka menu keanggotaan, cari anggota yang dimaksud, dan gunakan opsi "Ubah Peran". Perubahan peran langsung berlaku setelah disimpan. Anggota yang tidak lagi aktif dapat dinonaktifkan agar tidak dapat login ke sistem.',
    'feature',
    6,
    true
)
ON CONFLICT DO NOTHING;


-- FAQ -------------------------------------------------------------------------

INSERT INTO guide_sections (id, title, body, category, position, is_published) VALUES
(
    '00000003-0000-0000-0000-000000000001',
    'Lupa Kata Sandi?',
    'Jika Anda lupa kata sandi, jangan khawatir. Di halaman login, klik tautan "Lupa kata sandi?" yang terletak di bawah formulir login.

Masukkan alamat email yang terdaftar di akun Anda, lalu klik "Kirim". Sistem akan mengirimkan tautan untuk membuat kata sandi baru ke email Anda. Periksa folder inbox maupun folder spam jika email tidak muncul dalam beberapa menit.

Klik tautan di email tersebut dan ikuti instruksi untuk membuat kata sandi baru. Tautan ini hanya berlaku selama beberapa jam, jadi segera gunakan setelah menerimanya. Jika masalah berlanjut, hubungi pengurus RT Anda untuk meminta bantuan reset akun.',
    'faq',
    1,
    true
),
(
    '00000003-0000-0000-0000-000000000002',
    'Bagaimana Cara Mendaftarkan RT Baru?',
    'Pendaftaran RT baru di KasWarga dilakukan melalui proses registrasi yang dikelola oleh Super Admin sistem. RT yang ingin bergabung perlu menghubungi pengelola platform KasWarga untuk memulai proses pendaftaran.

Informasi yang umumnya diperlukan untuk pendaftaran RT baru meliputi nama RT/RW, alamat lengkap, kota/provinsi, nama dan email ketua RT, serta informasi rekening bank RT untuk keperluan pembayaran iuran.

Setelah pengajuan disetujui, ketua RT akan menerima undangan melalui email untuk mengaktifkan akun dan mulai mengonfigurasi data RT. Pengurus lainnya kemudian dapat ditambahkan oleh ketua RT setelah akun aktif.',
    'faq',
    2,
    true
),
(
    '00000003-0000-0000-0000-000000000003',
    'Apakah Data Saya Aman?',
    'Ya, keamanan data adalah prioritas utama KasWarga. Semua data disimpan di infrastruktur cloud yang aman dengan enkripsi data baik saat disimpan maupun saat dikirimkan melalui jaringan.

Sistem menggunakan Row-Level Security (RLS) yang memastikan setiap pengguna hanya dapat mengakses data yang memang menjadi haknya. Warga hanya dapat melihat data diri sendiri, pengurus hanya dapat mengakses data RT mereka sendiri, dan tidak ada data yang dapat dilihat lintas RT.

Akses ke aplikasi dilindungi dengan autentikasi berbasis email dan kata sandi. Kami menyarankan Anda untuk menggunakan kata sandi yang kuat, tidak berbagi akun dengan orang lain, dan segera menghubungi pengurus RT jika mencurigai akun Anda diakses oleh pihak yang tidak berwenang.',
    'faq',
    3,
    true
),
(
    '00000003-0000-0000-0000-000000000004',
    'Siapa yang Bisa Melihat Data Keuangan?',
    'Akses ke data keuangan RT dibatasi berdasarkan peran pengguna. Tidak semua anggota RT dapat melihat seluruh informasi keuangan.

Bendahara memiliki akses penuh untuk melihat dan mengelola pembayaran, pengeluaran, dan buku kas. Ketua RT juga memiliki akses penuh ke data keuangan sebagai bagian dari tanggung jawab pengawasan. Admin RT dapat membantu pengelolaan data tetapi aksesnya dapat dikonfigurasi sesuai kebijakan RT.

Warga biasa hanya dapat melihat riwayat pembayaran iuran mereka sendiri dan tidak dapat melihat data keuangan keseluruhan RT. Pengaturan hak akses ini dapat disesuaikan lebih lanjut oleh ketua RT melalui menu manajemen otorisasi.',
    'faq',
    4,
    true
),
(
    '00000003-0000-0000-0000-000000000005',
    'Bagaimana Cara Mengekspor Laporan?',
    'KasWarga menyediakan fitur ekspor laporan untuk memudahkan pengurus dalam berbagi data keuangan dengan warga atau untuk keperluan dokumentasi.

Buka menu "Laporan" di sidebar, lalu atur filter periode yang diinginkan (bulan dan tahun). Setelah data laporan tampil, cari tombol "Ekspor" di bagian atas atau sudut kanan halaman. Klik tombol tersebut dan pilih format ekspor yang tersedia.

File laporan akan otomatis diunduh ke perangkat Anda. Laporan yang diekspor biasanya mencakup ringkasan pemasukan, pengeluaran, saldo, dan daftar transaksi dalam periode yang dipilih. Fitur ekspor juga tersedia di beberapa halaman lain seperti daftar warga dan buku kas.',
    'faq',
    5,
    true
)
ON CONFLICT DO NOTHING;
