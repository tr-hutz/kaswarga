export const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    RT_ADMIN:    'Admin RT',
    RT_CHAIR:    'Ketua RT',
    TREASURER:   'Bendahara',
    SECRETARY:   'Sekretaris',
    RESIDENT:    'Warga',
}

export const MODULE_LABELS: Record<string, string> = {
    resident:     'Warga',
    membership:   'Keanggotaan',
    payment:      'Pembayaran',
    expense:      'Pengeluaran',
    income:       'Pemasukan',
    ledger:       'Buku Kas',
    report:       'Laporan',
    announcement: 'Pengumuman',
    event:        'Acara',
    document:     'Dokumen',
    settings:     'Pengaturan',
    rt:           'RT',
    user:         'Pengguna',
    role:         'Role',
    permission:   'Izin',
    rbac:         'Otorisasi',
    dashboard:    'Dasbor',
    import:       'Impor',
    audit:        'Audit',
    other:        'Lainnya',
}

export const PERMISSION_LABELS: Record<string, string> = {
    // Warga
    'resident.view':    'Lihat Warga',
    'resident.create':  'Tambah Warga',
    'resident.update':  'Ubah Warga',
    'resident.delete':  'Hapus Warga',
    'resident.approve': 'Setujui Warga',
    'resident.reject':  'Tolak Warga',
    'resident.export':  'Ekspor Warga',
    'resident.import':  'Impor Warga',

    // Keanggotaan
    'membership.view':        'Lihat Keanggotaan',
    'membership.create':      'Tambah Keanggotaan',
    'membership.update':      'Ubah Keanggotaan',
    'membership.delete':      'Hapus Keanggotaan',
    'membership.role_update': 'Ubah Role Keanggotaan',

    // Pembayaran
    'payment.view':           'Lihat Pembayaran',
    'payment.create':         'Tambah Pembayaran',
    'payment.update':         'Ubah Pembayaran',
    'payment.delete':         'Hapus Pembayaran',
    'payment.approve':        'Setujui Pembayaran',
    'payment.reject':         'Tolak Pembayaran',
    'payment.import':         'Impor Pembayaran',
    'payment.import_approve': 'Setujui Impor Pembayaran',
    'dashboard.payment.export':  'Ekspor Data Pembayaran',
    'dashboard.payment.arrears': 'Lihat Tunggakan',

    // Pengeluaran
    'expense.view':    'Lihat Pengeluaran',
    'expense.create':  'Tambah Pengeluaran',
    'expense.update':  'Ubah Pengeluaran',
    'expense.delete':  'Hapus Pengeluaran',
    'expense.approve': 'Setujui Pengeluaran',
    'expense.reject':  'Tolak Pengeluaran',
    'expense.export':  'Ekspor Pengeluaran',
    'expense.import':  'Impor Pengeluaran',

    // Pemasukan
    'income.view':    'Lihat Pemasukan',
    'income.create':  'Tambah Pemasukan',
    'income.update':  'Ubah Pemasukan',
    'income.delete':  'Hapus Pemasukan',
    'income.approve': 'Setujui Pemasukan',
    'income.reject':  'Tolak Pemasukan',
    'income.export':  'Ekspor Pemasukan',
    'income.import':  'Impor Pemasukan',

    // Donasi
    'income.donation.create':   'Tambah Donasi',
    'income.donation.update':   'Ubah Donasi',
    'income.donation.delete':   'Hapus Donasi',
    'income.donation.activate': 'Aktifkan Donasi',

    // Buku Kas
    'ledger.view':   'Lihat Buku Kas',
    'ledger.export': 'Ekspor Buku Kas',

    // Laporan
    'report.view':   'Lihat Laporan',
    'report.export': 'Ekspor Laporan',

    // Pengumuman
    'announcement.view':   'Lihat Pengumuman',
    'announcement.create': 'Tambah Pengumuman',
    'announcement.update': 'Ubah Pengumuman',
    'announcement.delete': 'Hapus Pengumuman',

    // Acara
    'event.view':   'Lihat Acara',
    'event.create': 'Tambah Acara',
    'event.update': 'Ubah Acara',
    'event.delete': 'Hapus Acara',

    // Pengaturan
    'settings.view':   'Lihat Pengaturan',
    'settings.update': 'Ubah Pengaturan',

    // RT
    'rt.delete': 'Hapus RT',

    // Pengguna
    'user.view':   'Lihat Pengguna',
    'user.create': 'Tambah Pengguna',
    'user.update': 'Ubah Pengguna',
    'user.delete': 'Hapus Pengguna',

    // Role
    'role.view':   'Lihat Role',
    'role.create': 'Tambah Role',
    'role.update': 'Ubah Role',

    // Izin
    'permission.view':     'Lihat Izin',
    'permission.update':   'Ubah Izin',
    'permission.override': 'Override Izin',

    // Impor
    'import.view': 'Lihat Impor',

    // Audit
    'audit.view': 'Lihat Audit',

    // Otorisasi
    'rbac.inspector.view': 'Lihat Inspector Otorisasi',
}
