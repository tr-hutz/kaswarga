/*
 * =============================================================================
 * SEED
 * Structural dev/QA data: RT, users, residents, memberships.
 * Runs automatically after migrations via: supabase db reset (CLI)
 * For cloud Supabase: paste each section into the SQL Editor after running
 * migrations 000–010.
 *
 * Auth users are NOT created here. For login to work:
 *   - Local CLI : insert into auth.users manually or use supabase auth sign-up
 *   - Cloud     : create users via Dashboard → Authentication → Users
 *                 using the emails below; the handle_new_user trigger will
 *                 populate public.users automatically.
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * RT  (10 rows — excludes the System RT inserted by 009_seed.sql)
 * --------------------------------------------------------------------------- */

insert into rt (id, name, code, address, city, province, postal_code, email, phone, monthly_fee, bank_name, account_number, account_holder, qris_url, logo_url, active, created_at)
values
    ('11111111-1111-1111-1111-111111111111', 'RT 01 RW 05', 'RT01', 'Ruko Melati Blok A', 'Bandung', 'Jawa Barat', '40123', 'rt01@example.com', '081200000001', 50000,  'BCA',     '1234567890', 'RT 01 RW 05', 'https://example.com/qris1.png',  'https://example.com/logo1.png',  true, '2026-01-01 08:00:00'),
    ('22222222-2222-2222-2222-222222222222', 'RT 02 RW 05', 'RT02', 'Ruko Melati Blok B', 'Bandung', 'Jawa Barat', '40123', 'rt02@example.com', '081200000002', 60000,  'BRI',     '1234567891', 'RT 02 RW 05', 'https://example.com/qris2.png',  'https://example.com/logo2.png',  true, '2026-01-01 08:00:00'),
    ('33333333-3333-3333-3333-333333333333', 'RT 03 RW 05', 'RT03', 'Ruko Melati Blok C', 'Bandung', 'Jawa Barat', '40123', 'rt03@example.com', '081200000003', 55000,  'BNI',     '1234567892', 'RT 03 RW 05', 'https://example.com/qris3.png',  'https://example.com/logo3.png',  true, '2026-01-01 08:00:00'),
    ('44444444-4444-4444-4444-444444444444', 'RT 04 RW 05', 'RT04', 'Ruko Melati Blok D', 'Bandung', 'Jawa Barat', '40123', 'rt04@example.com', '081200000004', 50000,  'Mandiri', '1234567893', 'RT 04 RW 05', 'https://example.com/qris4.png',  'https://example.com/logo4.png',  true, '2026-01-01 08:00:00'),
    ('55555555-5555-5555-5555-555555555555', 'RT 05 RW 05', 'RT05', 'Ruko Melati Blok E', 'Bandung', 'Jawa Barat', '40123', 'rt05@example.com', '081200000005', 65000,  'BCA',     '1234567894', 'RT 05 RW 05', 'https://example.com/qris5.png',  'https://example.com/logo5.png',  true, '2026-01-01 08:00:00'),
    ('66666666-6666-6666-6666-666666666666', 'RT 06 RW 05', 'RT06', 'Ruko Melati Blok F', 'Bandung', 'Jawa Barat', '40123', 'rt06@example.com', '081200000006', 50000,  'BRI',     '1234567895', 'RT 06 RW 05', 'https://example.com/qris6.png',  'https://example.com/logo6.png',  true, '2026-01-01 08:00:00'),
    ('77777777-7777-7777-7777-777777777777', 'RT 07 RW 05', 'RT07', 'Ruko Melati Blok G', 'Bandung', 'Jawa Barat', '40123', 'rt07@example.com', '081200000007', 70000,  'BNI',     '1234567896', 'RT 07 RW 05', 'https://example.com/qris7.png',  'https://example.com/logo7.png',  true, '2026-01-01 08:00:00'),
    ('88888888-8888-8888-8888-888888888888', 'RT 08 RW 05', 'RT08', 'Ruko Melati Blok H', 'Bandung', 'Jawa Barat', '40123', 'rt08@example.com', '081200000008', 55000,  'Mandiri', '1234567897', 'RT 08 RW 05', 'https://example.com/qris8.png',  'https://example.com/logo8.png',  true, '2026-01-01 08:00:00'),
    ('99999999-9999-9999-9999-999999999999', 'RT 09 RW 05', 'RT09', 'Ruko Melati Blok I', 'Bandung', 'Jawa Barat', '40123', 'rt09@example.com', '081200000009', 50000,  'BCA',     '1234567898', 'RT 09 RW 05', 'https://example.com/qris9.png',  'https://example.com/logo9.png',  true, '2026-01-01 08:00:00'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'RT 10 RW 05', 'RT10', 'Ruko Melati Blok J', 'Bandung', 'Jawa Barat', '40123', 'rt10@example.com', '081200000010', 60000,  'BRI',     '1234567899', 'RT 10 RW 05', 'https://example.com/qris10.png', 'https://example.com/logo10.png', true, '2026-01-01 08:00:00')
on conflict (id) do nothing;


/* ----------------------------------------------------------------------------
 * USERS  (13 rows — public.users only, no auth.users)
 * If you created these users via the Supabase dashboard, the trigger will have
 * already inserted their rows here. ON CONFLICT DO NOTHING handles that case.
 * --------------------------------------------------------------------------- */

insert into users (id, name, email, created_at)
values
    ('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'Budi Santoso',      'budi@example.com',    '2026-01-03 08:00:00'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'Siti Aminah',       'siti@example.com',    '2026-01-03 08:00:00'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'Andi Wijaya',       'andi@example.com',    '2026-01-03 08:00:00'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'Rina Marlina',      'rina@example.com',    '2026-01-03 08:00:00'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'Dedi Kurniawan',    'dedi@example.com',    '2026-01-03 08:00:00'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc6', 'Maya Sari',         'maya@example.com',    '2026-01-03 08:00:00'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc7', 'Fajar Nugraha',     'fajar@example.com',   '2026-01-03 08:00:00'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc8', 'Lina Fitriani',     'lina@example.com',    '2026-01-03 08:00:00'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc9', 'Rudi Hartono',      'rudi@example.com',    '2026-01-03 08:00:00'),
    ('cccccccc-cccc-cccc-cccc-cccccccccc10', 'Nina Oktavia',      'nina@example.com',    '2026-01-03 08:00:00'),
    ('cccccccc-cccc-cccc-cccc-cccccccccc11', 'Hendra Wijaya',     'hendra@example.com',  '2026-01-03 08:00:00'),
    ('cccccccc-cccc-cccc-cccc-cccccccccc12', 'Dewi Rahayu',       'dewi@example.com',    '2026-01-03 08:00:00'),
    ('cccccccc-cccc-cccc-cccc-cccccccccc13', 'Teguh Santoso',     'teguh@example.com',   '2026-01-03 08:00:00')
on conflict (id) do nothing;


/* ----------------------------------------------------------------------------
 * RESIDENTS  (24 rows across RT 01–05)
 * --------------------------------------------------------------------------- */

insert into residents (id, rt_id, name, block, house_number, email, created_at)
values
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',  '11111111-1111-1111-1111-111111111111', 'Budi Santoso',        'A', '01', 'budi@example.com',    '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',  '11111111-1111-1111-1111-111111111111', 'Siti Aminah',         'A', '02', 'siti@example.com',    '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',  '22222222-2222-2222-2222-222222222222', 'Andi Wijaya',         'B', '01', 'andi@example.com',    '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4',  '22222222-2222-2222-2222-222222222222', 'Rina Marlina',        'B', '02', 'rina@example.com',    '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5',  '33333333-3333-3333-3333-333333333333', 'Dedi Kurniawan',      'C', '01', 'dedi@example.com',    '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6',  '33333333-3333-3333-3333-333333333333', 'Maya Sari',           'C', '02', 'maya@example.com',    '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7',  '44444444-4444-4444-4444-444444444444', 'Fajar Nugraha',       'D', '01', 'fajar@example.com',   '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb8',  '44444444-4444-4444-4444-444444444444', 'Lina Fitriani',       'D', '02', 'lina@example.com',    '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb9',  '55555555-5555-5555-5555-555555555555', 'Rudi Hartono',        'E', '01', 'rudi@example.com',    '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb10',  '55555555-5555-5555-5555-555555555555', 'Nina Oktavia',        'E', '02', 'nina@example.com',    '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb11',  '11111111-1111-1111-1111-111111111111', 'Hendra Wijaya',       'A', '03', 'hendra@example.com',  '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb12',  '11111111-1111-1111-1111-111111111111', 'Dewi Rahayu',         'A', '04', 'dewi@example.com',    '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb13',  '11111111-1111-1111-1111-111111111111', 'Agus Setiawan',       'A', '05', 'agus@example.com',    '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb14',  '11111111-1111-1111-1111-111111111111', 'Fitri Handayani',     'A', '06', 'fitri@example.com',   '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb15',  '11111111-1111-1111-1111-111111111111', 'Bambang Supriyanto',  'A', '07', 'bambang@example.com', '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb16',  '11111111-1111-1111-1111-111111111111', 'Sri Wahyuni',         'A', '08', 'sri@example.com',     '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb17',  '11111111-1111-1111-1111-111111111111', 'Wahyu Pratama',       'A', '09', 'wahyu@example.com',   '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb18',  '11111111-1111-1111-1111-111111111111', 'Eka Susanti',         'A', '10', 'eka@example.com',     '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb19',  '22222222-2222-2222-2222-222222222222', 'Teguh Santoso',       'B', '03', 'teguh@example.com',   '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb20',  '22222222-2222-2222-2222-222222222222', 'Yuni Astuti',         'B', '04', 'yuni@example.com',    '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb21',  '22222222-2222-2222-2222-222222222222', 'Dian Permata',        'B', '05', 'dian@example.com',    '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb22',  '22222222-2222-2222-2222-222222222222', 'Hadi Saputra',        'B', '06', 'hadi@example.com',    '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb23',  '22222222-2222-2222-2222-222222222222', 'Ratna Dewi',          'B', '07', 'ratna@example.com',   '2026-01-02 08:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb24',  '22222222-2222-2222-2222-222222222222', 'Surya Atmaja',        'B', '08', 'surya@example.com',   '2026-01-02 08:00:00')
on conflict (id) do nothing;


/* ----------------------------------------------------------------------------
 * MEMBERSHIPS  (13 rows)
 * --------------------------------------------------------------------------- */

insert into memberships (id, user_id, rt_id, resident_id, role, created_at)
values
    ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',  'ADMIN',     '2026-01-04 08:00:00'),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd2', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',  'RESIDENT',  '2026-01-04 08:00:00'),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd3', 'cccccccc-cccc-cccc-cccc-ccccccccccc3', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',  'TREASURER', '2026-01-04 08:00:00'),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd4', 'cccccccc-cccc-cccc-cccc-ccccccccccc4', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4',  'RESIDENT',  '2026-01-04 08:00:00'),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd5', 'cccccccc-cccc-cccc-cccc-ccccccccccc5', '33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5',  'ADMIN',     '2026-01-04 08:00:00'),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd6', 'cccccccc-cccc-cccc-cccc-ccccccccccc6', '33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6',  'RESIDENT',  '2026-01-04 08:00:00'),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd7', 'cccccccc-cccc-cccc-cccc-ccccccccccc7', '44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7',  'TREASURER', '2026-01-04 08:00:00'),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd8', 'cccccccc-cccc-cccc-cccc-ccccccccccc8', '44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb8',  'RESIDENT',  '2026-01-04 08:00:00'),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd9', 'cccccccc-cccc-cccc-cccc-ccccccccccc9', '55555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb9',  'ADMIN',     '2026-01-04 08:00:00'),
    ('dddddddd-dddd-dddd-dddd-dddddddddd10', 'cccccccc-cccc-cccc-cccc-cccccccccc10', '55555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb10', 'RESIDENT',  '2026-01-04 08:00:00'),
    ('dddddddd-dddd-dddd-dddd-dddddddddd11', 'cccccccc-cccc-cccc-cccc-cccccccccc11', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb11', 'CHAIR',     '2026-01-04 08:00:00'),
    ('dddddddd-dddd-dddd-dddd-dddddddddd12', 'cccccccc-cccc-cccc-cccc-cccccccccc12', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb12', 'TREASURER', '2026-01-04 08:00:00'),
    ('dddddddd-dddd-dddd-dddd-dddddddddd13', 'cccccccc-cccc-cccc-cccc-cccccccccc13', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb19', 'CHAIR',     '2026-01-04 08:00:00')
on conflict (id) do nothing;
