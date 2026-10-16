/*
 * =============================================================================
 * 033_GUIDE_SEED
 * Pre-populated user guide sections with translations.
 * Safe to re-run — all inserts use ON CONFLICT DO NOTHING.
 * =============================================================================
 */

-- Sections (metadata only — no title/body) ------------------------------------

INSERT INTO guide_sections (id, category, position, is_published) VALUES
    ('00000001-0000-0000-0000-000000000001', 'quick_start', 1, true),
    ('00000001-0000-0000-0000-000000000002', 'quick_start', 2, true),
    ('00000001-0000-0000-0000-000000000003', 'quick_start', 3, true),
    ('00000001-0000-0000-0000-000000000004', 'quick_start', 4, true),
    ('00000002-0000-0000-0000-000000000001', 'feature',     1, true),
    ('00000002-0000-0000-0000-000000000002', 'feature',     2, true),
    ('00000002-0000-0000-0000-000000000003', 'feature',     3, true),
    ('00000002-0000-0000-0000-000000000004', 'feature',     4, true),
    ('00000002-0000-0000-0000-000000000006', 'feature',     5, true),
    ('00000003-0000-0000-0000-000000000001', 'faq',         1, true),
    ('00000003-0000-0000-0000-000000000002', 'faq',         2, true),
    ('00000003-0000-0000-0000-000000000003', 'faq',         3, true),
    ('00000003-0000-0000-0000-000000000004', 'faq',         4, true),
    ('00000003-0000-0000-0000-000000000005', 'faq',         5, true)
ON CONFLICT DO NOTHING;


-- Indonesian translations ------------------------------------------------------

INSERT INTO guide_section_translations (section_id, locale, title, body) VALUES
(
    '00000001-0000-0000-0000-000000000001', 'id',
    'Selamat Datang di KasWarga',
    'KasWarga adalah aplikasi manajemen keuangan dan administrasi untuk Rukun Tetangga (RT). Aplikasi ini membantu pengurus RT mengelola data warga, pencatatan iuran bulanan, pengeluaran RT, serta laporan keuangan secara digital dan transparan.

[GUIDE_IMG:qs-dashboard.png|Tampilan dashboard utama KasWarga]

Dengan KasWarga, bendahara dapat mencatat setiap pembayaran iuran warga, ketua RT dapat memantau kondisi keuangan secara real-time, dan warga dapat melihat riwayat pembayaran mereka sendiri.

Panduan ini akan membantu Anda memahami fitur-fitur utama aplikasi dan cara menggunakannya dengan benar.'
),
(
    '00000001-0000-0000-0000-000000000002', 'id',
    'Cara Login',
    'Untuk masuk ke aplikasi KasWarga, buka halaman login di browser Anda. Masukkan alamat email yang telah didaftarkan oleh pengurus RT Anda, lalu masukkan kata sandi Anda.

[GUIDE_IMG:qs-login-page.png|Halaman login KasWarga]

Klik tombol "Masuk" untuk melanjutkan. Jika email dan kata sandi benar, Anda akan diarahkan ke halaman dasbor utama.

Jika Anda lupa kata sandi, klik tautan "Lupa kata sandi?" di halaman login dan ikuti instruksi yang dikirimkan ke email Anda. Pastikan Anda menggunakan email yang terdaftar di sistem RT Anda.'
),
(
    '00000001-0000-0000-0000-000000000003', 'id',
    'Navigasi Dasar',
    'Setelah login, Anda akan melihat sidebar di sisi kiri layar yang berisi menu navigasi utama. Setiap menu membawa Anda ke bagian fitur yang berbeda.

[GUIDE_IMG:qs-sidebar-nav.png|Menu navigasi KasWarga]

Menu "Dasbor" menampilkan ringkasan kondisi keuangan RT, termasuk saldo saat ini, iuran terbaru, dan pengeluaran terakhir. Menu "Warga" berisi daftar seluruh warga yang terdaftar di RT Anda.

Menu "Pembayaran" digunakan untuk mengelola konfirmasi iuran warga. Menu "Pengeluaran" untuk mencatat dan mengelola pengeluaran RT. Menu "Laporan" menampilkan rekap keuangan dan buku kas. Di bagian atas halaman terdapat tombol profil untuk mengakses pengaturan akun Anda.'
),
(
    '00000001-0000-0000-0000-000000000004', 'id',
    'Ubah Kata Sandi',
    'Untuk mengubah kata sandi, klik ikon profil atau nama Anda di bagian atas halaman (topbar). Pilih "Pengaturan" atau "Profil" dari menu yang muncul.

[GUIDE_IMG:qs-profile-settings.png|Halaman pengaturan profil]

Di halaman pengaturan akun, Anda akan menemukan opsi untuk mengubah kata sandi. Masukkan kata sandi lama Anda untuk verifikasi, kemudian masukkan kata sandi baru dua kali untuk konfirmasi. Klik "Simpan" untuk menyimpan perubahan.

Gunakan kata sandi yang kuat dengan kombinasi huruf besar, huruf kecil, angka, dan simbol agar akun Anda tetap aman.'
),
(
    '00000002-0000-0000-0000-000000000001', 'id',
    'Kelola Data Warga',
    'Menu "Warga" menampilkan daftar seluruh warga yang terdaftar di RT Anda beserta informasi seperti nama, alamat, blok dan nomor rumah, serta status keanggotaan.

[GUIDE_IMG:feat-residents.png|Daftar warga RT]

Untuk menambahkan warga baru, klik tombol "Tambah Warga" di sudut kanan atas, lalu isi formulir dengan data yang diperlukan. Data yang umumnya dibutuhkan meliputi nama lengkap, nomor rumah, blok, dan alamat email jika warga ingin mengakses aplikasi.

Untuk mengedit data warga, klik baris warga yang ingin diubah atau klik ikon edit. Untuk menonaktifkan warga yang sudah pindah, gunakan menu aksi yang tersedia. Data warga yang dinonaktifkan tetap tersimpan untuk keperluan riwayat.'
),
(
    '00000002-0000-0000-0000-000000000002', 'id',
    'Pencatatan Iuran',
    'Fitur pembayaran iuran digunakan untuk mencatat pembayaran bulanan dari warga. Warga atau pengurus dapat mengunggah bukti transfer pembayaran sebagai konfirmasi.

[GUIDE_IMG:feat-payments.png|Halaman konfirmasi pembayaran iuran]

Bendahara dapat melihat daftar konfirmasi pembayaran yang masuk di menu "Pembayaran". Setiap konfirmasi menampilkan nama warga, jumlah, periode bulan yang dibayar, dan bukti transfer yang diunggah.

Untuk menyetujui konfirmasi, klik tombol "Setujui". Sistem secara otomatis akan memperbarui status iuran warga dan mencatat transaksi ke buku kas. Jika bukti tidak valid, gunakan tombol "Tolak" dan berikan alasan penolakan agar warga dapat mengirim ulang.'
),
(
    '00000002-0000-0000-0000-000000000003', 'id',
    'Pencatatan Pengeluaran',
    'Menu "Pengeluaran" digunakan untuk mencatat semua pengeluaran yang dilakukan oleh RT, seperti biaya kebersihan, keamanan, pemeliharaan fasilitas, dan operasional lainnya.

[GUIDE_IMG:feat-expenses.png|Daftar pengeluaran RT]

Untuk menambahkan pengeluaran baru, klik tombol "Tambah Pengeluaran", lalu isi formulir dengan kategori, tanggal, jumlah, nama penerima, dan deskripsi singkat. Pengeluaran yang baru dibuat akan berada dalam status "Menunggu Persetujuan".

Ketua RT bertugas meninjau dan menyetujui pengeluaran. Setelah disetujui, saldo kas RT akan otomatis berkurang sesuai jumlah pengeluaran dan transaksi akan tercatat di buku kas. Pengeluaran yang ditolak dapat diperbaiki dan diajukan kembali.'
),
(
    '00000002-0000-0000-0000-000000000004', 'id',
    'Laporan Keuangan',
    'Menu "Laporan" menampilkan ringkasan kondisi keuangan RT secara keseluruhan, termasuk total pemasukan dari iuran, total pengeluaran, dan saldo saat ini.

[GUIDE_IMG:feat-reports.png|Laporan keuangan RT]

Buku kas menampilkan seluruh riwayat transaksi secara kronologis, baik pemasukan maupun pengeluaran, lengkap dengan tanggal dan keterangan. Anda dapat memfilter berdasarkan periode bulan dan tahun untuk melihat laporan dalam rentang waktu tertentu.

Laporan juga menampilkan daftar warga yang masih memiliki tunggakan iuran, beserta jumlah bulan yang belum dibayar dan total nominal tunggakan. Fitur ekspor tersedia untuk mengunduh laporan dalam format yang dapat dibagikan kepada pengurus RT.'
),
(
    '00000002-0000-0000-0000-000000000006', 'id',
    'Manajemen Anggota',
    'Menu "Keanggotaan" atau "Pengguna" memungkinkan pengurus untuk mengelola siapa saja yang memiliki akses ke aplikasi dan dengan peran apa.

[GUIDE_IMG:feat-members.png|Halaman manajemen anggota RT]

Setiap anggota RT dapat memiliki salah satu dari beberapa peran: Warga (akses terbatas untuk melihat data sendiri), Bendahara (mengelola pembayaran dan pengeluaran), Admin RT (mengelola data warga dan keanggotaan), atau Ketua RT (akses penuh dan persetujuan pengeluaran).

Untuk mengubah peran anggota, buka menu keanggotaan, cari anggota yang dimaksud, dan gunakan opsi "Ubah Peran". Perubahan peran langsung berlaku setelah disimpan. Anggota yang tidak lagi aktif dapat dinonaktifkan agar tidak dapat login ke sistem.'
),
(
    '00000003-0000-0000-0000-000000000001', 'id',
    'Lupa Kata Sandi?',
    'Jika Anda lupa kata sandi, jangan khawatir. Di halaman login, klik tautan "Lupa kata sandi?" yang terletak di bawah formulir login.

[GUIDE_IMG:faq-forgot-password.png|Halaman lupa kata sandi]

Masukkan alamat email yang terdaftar di akun Anda, lalu klik "Kirim". Sistem akan mengirimkan tautan untuk membuat kata sandi baru ke email Anda. Periksa folder inbox maupun folder spam jika email tidak muncul dalam beberapa menit.

Klik tautan di email tersebut dan ikuti instruksi untuk membuat kata sandi baru. Tautan ini hanya berlaku selama beberapa jam, jadi segera gunakan setelah menerimanya. Jika masalah berlanjut, hubungi pengurus RT Anda untuk meminta bantuan reset akun.'
),
(
    '00000003-0000-0000-0000-000000000002', 'id',
    'Bagaimana Cara Mendaftarkan RT Baru?',
    'Pendaftaran RT baru di KasWarga dilakukan melalui proses registrasi yang dikelola oleh Super Admin sistem. RT yang ingin bergabung perlu menghubungi pengelola platform KasWarga untuk memulai proses pendaftaran.

Informasi yang umumnya diperlukan untuk pendaftaran RT baru meliputi nama RT/RW, alamat lengkap, kota/provinsi, nama dan email ketua RT, serta informasi rekening bank RT untuk keperluan pembayaran iuran.

Setelah pengajuan disetujui, ketua RT akan menerima undangan melalui email untuk mengaktifkan akun dan mulai mengonfigurasi data RT. Pengurus lainnya kemudian dapat ditambahkan oleh ketua RT setelah akun aktif.'
),
(
    '00000003-0000-0000-0000-000000000003', 'id',
    'Apakah Data Saya Aman?',
    'Ya, keamanan data adalah prioritas utama KasWarga. Semua data disimpan di infrastruktur cloud yang aman dengan enkripsi data baik saat disimpan maupun saat dikirimkan melalui jaringan.

Sistem menggunakan Row-Level Security (RLS) yang memastikan setiap pengguna hanya dapat mengakses data yang memang menjadi haknya. Warga hanya dapat melihat data diri sendiri, pengurus hanya dapat mengakses data RT mereka sendiri, dan tidak ada data yang dapat dilihat lintas RT.

Akses ke aplikasi dilindungi dengan autentikasi berbasis email dan kata sandi. Kami menyarankan Anda untuk menggunakan kata sandi yang kuat, tidak berbagi akun dengan orang lain, dan segera menghubungi pengurus RT jika mencurigai akun Anda diakses oleh pihak yang tidak berwenang.'
),
(
    '00000003-0000-0000-0000-000000000004', 'id',
    'Siapa yang Bisa Melihat Data Keuangan?',
    'Akses ke data keuangan RT dibatasi berdasarkan peran pengguna. Tidak semua anggota RT dapat melihat seluruh informasi keuangan.

Bendahara memiliki akses penuh untuk melihat dan mengelola pembayaran, pengeluaran, dan buku kas. Ketua RT juga memiliki akses penuh ke data keuangan sebagai bagian dari tanggung jawab pengawasan. Admin RT dapat membantu pengelolaan data tetapi aksesnya dapat dikonfigurasi sesuai kebijakan RT.

Warga biasa hanya dapat melihat riwayat pembayaran iuran mereka sendiri dan tidak dapat melihat data keuangan keseluruhan RT. Pengaturan hak akses ini dapat disesuaikan lebih lanjut oleh ketua RT melalui menu manajemen otorisasi.'
),
(
    '00000003-0000-0000-0000-000000000005', 'id',
    'Bagaimana Cara Mengekspor Laporan?',
    'KasWarga menyediakan fitur ekspor laporan untuk memudahkan pengurus dalam berbagi data keuangan dengan warga atau untuk keperluan dokumentasi.

Buka menu "Laporan" di sidebar, lalu atur filter periode yang diinginkan (bulan dan tahun). Setelah data laporan tampil, cari tombol "Ekspor" di bagian atas atau sudut kanan halaman. Klik tombol tersebut dan pilih format ekspor yang tersedia.

File laporan akan otomatis diunduh ke perangkat Anda. Laporan yang diekspor biasanya mencakup ringkasan pemasukan, pengeluaran, saldo, dan daftar transaksi dalam periode yang dipilih. Fitur ekspor juga tersedia di beberapa halaman lain seperti daftar warga dan buku kas.'
)
ON CONFLICT DO NOTHING;


-- English translations ---------------------------------------------------------

INSERT INTO guide_section_translations (section_id, locale, title, body) VALUES
(
    '00000001-0000-0000-0000-000000000001', 'en',
    'Welcome to KasWarga',
    'KasWarga is a financial management and administration application for Rukun Tetangga (RT) — Indonesian neighbourhood associations. It helps RT administrators manage resident data, record monthly dues, track expenses, and maintain transparent financial reports digitally.

[GUIDE_IMG:qs-dashboard.png|KasWarga main dashboard]

With KasWarga, the treasurer can record every resident''s dues payment, the RT chair can monitor the financial position in real time, and residents can view their own payment history.

This guide will help you understand the key features of the application and how to use them correctly.'
),
(
    '00000001-0000-0000-0000-000000000002', 'en',
    'How to Log In',
    'To log in to KasWarga, open the login page in your browser. Enter the email address that was registered for you by your RT administrator, then enter your password.

[GUIDE_IMG:qs-login-page.png|KasWarga login page]

Click the "Masuk" (Sign In) button to continue. If your email and password are correct, you will be redirected to the main dashboard.

If you have forgotten your password, click the "Lupa kata sandi?" (Forgot password?) link on the login page and follow the instructions sent to your email. Make sure you use the email address registered in your RT''s system.'
),
(
    '00000001-0000-0000-0000-000000000003', 'en',
    'Basic Navigation',
    'After logging in, you will see a sidebar on the left side of the screen containing the main navigation menu. Each menu item takes you to a different feature section.

[GUIDE_IMG:qs-sidebar-nav.png|KasWarga navigation menu]

The "Dasbor" (Dashboard) menu shows a summary of the RT''s financial position, including the current balance, latest dues, and most recent expenses. The "Warga" (Residents) menu lists all residents registered in your RT.

The "Pembayaran" (Payments) menu manages resident dues confirmations. "Pengeluaran" (Expenses) is for recording and managing RT expenditures. "Laporan" (Reports) shows the financial summary and cash ledger. At the top of the page you will find a profile button to access your account settings.'
),
(
    '00000001-0000-0000-0000-000000000004', 'en',
    'Change Your Password',
    'To change your password, click your profile icon or name at the top of the page (topbar). Select "Pengaturan" (Settings) or "Profil" (Profile) from the menu that appears.

[GUIDE_IMG:qs-profile-settings.png|Profile settings page]

On the account settings page, you will find the option to change your password. Enter your current password for verification, then enter your new password twice to confirm. Click "Simpan" (Save) to apply the change.

Use a strong password with a combination of uppercase letters, lowercase letters, numbers, and symbols to keep your account secure.'
),
(
    '00000002-0000-0000-0000-000000000001', 'en',
    'Managing Resident Data',
    'The "Warga" (Residents) menu displays a list of all residents registered in your RT, along with information such as name, address, block, house number, and membership status.

[GUIDE_IMG:feat-residents.png|RT residents list]

To add a new resident, click the "Tambah Warga" (Add Resident) button in the top-right corner, then fill in the required information. Typical fields include full name, house number, block, and email address if the resident wants to access the application.

To edit a resident''s data, click on their row or the edit icon. To deactivate a resident who has moved out, use the action menu available in the list. Deactivated resident data is retained for historical purposes.'
),
(
    '00000002-0000-0000-0000-000000000002', 'en',
    'Recording Dues Payments',
    'The dues payment feature is used to record monthly payments from residents. Residents or administrators can upload a payment transfer receipt as confirmation.

[GUIDE_IMG:feat-payments.png|Dues payment confirmation page]

The treasurer can view incoming payment confirmations in the "Pembayaran" (Payments) menu. Each confirmation shows the resident''s name, amount, the months being paid for, and the uploaded transfer receipt.

To approve a confirmation, click the "Setujui" (Approve) button. The system will automatically update the resident''s dues status and record the transaction in the cash ledger. If the receipt is invalid, use the "Tolak" (Reject) button and provide a reason so the resident can resubmit.'
),
(
    '00000002-0000-0000-0000-000000000003', 'en',
    'Recording Expenses',
    'The "Pengeluaran" (Expenses) menu is used to record all expenditures made by the RT, such as cleaning fees, security costs, facility maintenance, and other operational expenses.

[GUIDE_IMG:feat-expenses.png|RT expenses list]

To add a new expense, click "Tambah Pengeluaran" (Add Expense), then fill in the form with the category, date, amount, recipient name, and a brief description. Newly created expenses will be in "Pending Approval" status.

The RT chair is responsible for reviewing and approving expenses. Once approved, the RT''s cash balance is automatically reduced by the expense amount and the transaction is recorded in the ledger. Rejected expenses can be corrected and resubmitted.'
),
(
    '00000002-0000-0000-0000-000000000004', 'en',
    'Financial Reports',
    'The "Laporan" (Reports) menu shows an overall summary of the RT''s financial position, including total income from dues, total expenses, and the current balance.

[GUIDE_IMG:feat-reports.png|RT financial reports]

The cash ledger displays the complete transaction history in chronological order — both income and expenses — with dates and descriptions. You can filter by month and year to view a report for a specific period.

The report also shows a list of residents who still have outstanding dues, along with the number of months unpaid and the total amount owed. An export feature is available to download the report in a format suitable for sharing with RT administrators.'
),
(
    '00000002-0000-0000-0000-000000000006', 'en',
    'Member Management',
    'The "Keanggotaan" (Membership) or "Pengguna" (Users) menu allows administrators to manage who has access to the application and in what role.

[GUIDE_IMG:feat-members.png|RT member management page]

Each RT member can be assigned one of several roles: Warga/Resident (limited access to view their own data), Bendahara/Treasurer (manages payments and expenses), Admin RT (manages resident data and memberships), or Ketua RT/Chair (full access and expense approval authority).

To change a member''s role, open the membership menu, find the member, and use the "Ubah Peran" (Change Role) option. Role changes take effect immediately after saving. Members who are no longer active can be deactivated to prevent them from logging in.'
),
(
    '00000003-0000-0000-0000-000000000001', 'en',
    'Forgot Your Password?',
    'If you have forgotten your password, don''t worry. On the login page, click the "Lupa kata sandi?" (Forgot password?) link located below the login form.

[GUIDE_IMG:faq-forgot-password.png|Forgot password page]

Enter the email address registered to your account, then click "Kirim" (Send). The system will send a link to create a new password to your email. Check your inbox as well as your spam folder if the email does not arrive within a few minutes.

Click the link in the email and follow the instructions to set a new password. The link is only valid for a few hours, so use it promptly after receiving it. If the problem persists, contact your RT administrator to request an account reset.'
),
(
    '00000003-0000-0000-0000-000000000002', 'en',
    'How to Register a New RT?',
    'Registering a new RT on KasWarga is handled through a registration process managed by the system Super Admin. An RT wishing to join should contact the KasWarga platform administrator to initiate the registration process.

Information typically required for a new RT registration includes the RT/RW name, full address, city and province, the RT chair''s name and email address, and the RT''s bank account details for dues collection purposes.

Once the application is approved, the RT chair will receive an invitation by email to activate their account and begin configuring the RT''s data. Other administrators can then be added by the RT chair after the account is active.'
),
(
    '00000003-0000-0000-0000-000000000003', 'en',
    'Is My Data Secure?',
    'Yes, data security is KasWarga''s top priority. All data is stored in secure cloud infrastructure with encryption both at rest and in transit over the network.

The system uses Row-Level Security (RLS), which ensures every user can only access data they are authorised to see. Residents can only view their own data, administrators can only access their own RT''s data, and no data is visible across different RTs.

Access to the application is protected by email and password authentication. We recommend using a strong password, not sharing your account with others, and contacting your RT administrator immediately if you suspect your account has been accessed by an unauthorised party.'
),
(
    '00000003-0000-0000-0000-000000000004', 'en',
    'Who Can View Financial Data?',
    'Access to the RT''s financial data is restricted based on user role. Not all RT members can view the full financial information.

The treasurer has full access to view and manage payments, expenses, and the cash ledger. The RT chair also has full access to financial data as part of their oversight responsibilities. The RT Admin can assist with data management but their access can be configured according to the RT''s policies.

Regular residents can only view their own dues payment history and cannot see the overall RT financial data. These access permissions can be customised further by the RT chair through the authorisation management menu.'
),
(
    '00000003-0000-0000-0000-000000000005', 'en',
    'How to Export a Report?',
    'KasWarga provides a report export feature to make it easy for administrators to share financial data with residents or for documentation purposes.

Open the "Laporan" (Reports) menu in the sidebar, then set the desired period filter (month and year). Once the report data is displayed, look for the "Ekspor" (Export) button at the top or in the top-right corner of the page. Click it and select the available export format.

The report file will be automatically downloaded to your device. Exported reports typically include a summary of income, expenses, balance, and a list of transactions for the selected period. The export feature is also available on several other pages such as the resident list and the cash ledger.'
)
ON CONFLICT DO NOTHING;
