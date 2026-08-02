-- ============================================================
-- RLS VALIDATION SUITE — Sprint 5.3
-- KasWarga · feat/rbac-v2-rls-assessment-compatibility
--
-- PURPOSE
--   Verify that every RLS policy enforces the expected access
--   decisions after Sprints 5.1 and 5.2 migrations.
--
-- HOW TO RUN
--   Execute against a TEST database only (NOT production).
--   Each block wraps its statements in a transaction that is
--   rolled back, so no test data persists.
--
-- SETUP REQUIRED
--   Replace the UUIDs below with real test-fixture values
--   from your test database before running.
--
-- CONVENTIONS
--   Expected result is documented in the comment above each query.
--   PASS  → query returns rows / no error
--   BLOCK → query returns 0 rows (RLS filters) or raises an error
-- ============================================================


-- ============================================================
-- TEST FIXTURE PLACEHOLDERS
-- Replace these with real UUIDs from your test database.
-- ============================================================

-- RT A (normal RT)
\set rt_a_id        '00000000-0000-0000-0000-000000000aa1'

-- RT B (different RT — used for cross-tenant tests)
\set rt_b_id        '00000000-0000-0000-0000-000000000bb1'

-- System RT (must never be visible to normal users)
\set system_rt_id   '00000000-0000-0000-0000-000000000001'

-- Users
\set super_admin_id '00000000-0000-0000-0000-000000001000'
\set rt_admin_id    '00000000-0000-0000-0000-000000001001'
\set rt_chair_id    '00000000-0000-0000-0000-000000001002'
\set treasurer_id   '00000000-0000-0000-0000-000000001003'
\set resident_id    '00000000-0000-0000-0000-000000001004'
\set rt_b_admin_id  '00000000-0000-0000-0000-000000001005'

-- Sample row IDs (from RT A)
\set sample_resident_id    '00000000-0000-0000-0000-000000002001'
\set sample_expense_id     '00000000-0000-0000-0000-000000002002'
\set sample_confirmation_id '00000000-0000-0000-0000-000000002003'


-- ============================================================
-- HELPER: simulate an authenticated session for a given user
-- ============================================================

-- Usage:
--   SELECT set_config('request.jwt.claims',
--     '{"sub":"<user_uuid>","role":"authenticated"}', true);
--   SET LOCAL role = 'authenticated';
--
-- Both lines must be run within the same transaction block.
-- The SET LOCAL and set_config(... true) calls are transaction-local.


-- ============================================================
-- SECTION 1 — Authorized Access (must PASS / return rows)
-- ============================================================

-- -------------------------------------------------------
-- 1.1  RT_ADMIN reads residents in own RT
--      Expected: PASS (RT_ADMIN has resident.view)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'rt_admin_id'), true);
  SET LOCAL role = 'authenticated';

  -- Should return rows
  SELECT 'EXPECT PASS: RT_ADMIN reads residents in own RT' AS test,
         count(*) AS row_count
  FROM   residents
  WHERE  rt_id = :'rt_a_id';
ROLLBACK;


-- -------------------------------------------------------
-- 1.2  TREASURER reads expenses in own RT
--      Expected: PASS (TREASURER has expense.view)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'treasurer_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT PASS: TREASURER reads expenses in own RT' AS test,
         count(*) AS row_count
  FROM   expenses
  WHERE  rt_id = :'rt_a_id';
ROLLBACK;


-- -------------------------------------------------------
-- 1.3  RESIDENT reads their own payment confirmations
--      Expected: PASS (RESIDENT has payment.view)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'resident_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT PASS: RESIDENT reads payment_confirmations in own RT' AS test,
         count(*) AS row_count
  FROM   payment_confirmations
  WHERE  rt_id = :'rt_a_id';
ROLLBACK;


-- -------------------------------------------------------
-- 1.4  RESIDENT submits a new payment confirmation
--      Expected: PASS (RESIDENT has payment.create)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'resident_id'), true);
  SET LOCAL role = 'authenticated';

  -- Should not raise an RLS violation
  INSERT INTO payment_confirmations (rt_id, resident_id, year, total_amount, proof_url, status)
  VALUES (:'rt_a_id', :'sample_resident_id', 2025, 50000, 'https://example.com/proof.jpg', 'pending');
  -- (Row is rolled back — test confirms no RLS error)
  SELECT 'EXPECT PASS: RESIDENT inserts payment_confirmation' AS test;
ROLLBACK;


-- -------------------------------------------------------
-- 1.5  RT_ADMIN reads audit logs in own RT
--      Expected: PASS (RT_ADMIN has audit.view — migration 022)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'rt_admin_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT PASS: RT_ADMIN reads activity_logs in own RT' AS test,
         count(*) AS row_count
  FROM   activity_logs
  WHERE  rt_id = :'rt_a_id';
ROLLBACK;


-- -------------------------------------------------------
-- 1.6  RT_ADMIN updates RT profile
--      Expected: PASS (RT_ADMIN has settings.update — migration 023)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'rt_admin_id'), true);
  SET LOCAL role = 'authenticated';

  UPDATE rt SET updated_at = now() WHERE id = :'rt_a_id';
  SELECT 'EXPECT PASS: RT_ADMIN updates own RT profile' AS test;
ROLLBACK;


-- -------------------------------------------------------
-- 1.7  SUPER_ADMIN reads ALL residents across all RTs
--      Expected: PASS (SUPER_ADMIN bypasses all RLS)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'super_admin_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT PASS: SUPER_ADMIN reads residents across all RTs' AS test,
         count(*) AS row_count
  FROM   residents;
ROLLBACK;


-- -------------------------------------------------------
-- 1.8  Any authenticated user reads roles catalog
--      Expected: PASS (migration 020 — open SELECT on roles)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'resident_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT PASS: Authenticated user reads roles catalog' AS test,
         count(*) AS row_count
  FROM   roles;
ROLLBACK;


-- -------------------------------------------------------
-- 1.9  RT_ADMIN reads rt_permission_overrides for own RT
--      Expected: PASS (RT_ADMIN has permission.override)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'rt_admin_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT PASS: RT_ADMIN reads rt_permission_overrides for own RT' AS test,
         count(*) AS row_count
  FROM   rt_permission_overrides
  WHERE  rt_id = :'rt_a_id';
ROLLBACK;


-- -------------------------------------------------------
-- 1.10 User reads their own notifications
--      Expected: PASS (notifications: read own)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'resident_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT PASS: User reads own notifications' AS test,
         count(*) AS row_count
  FROM   notifications
  WHERE  target_user_id = :'resident_id';
ROLLBACK;


-- ============================================================
-- SECTION 2 — Unauthorized Access (must BLOCK / return 0 rows)
-- ============================================================

-- -------------------------------------------------------
-- 2.1  RESIDENT tries to update an expense
--      Expected: BLOCK (RESIDENT has no expense.update)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'resident_id'), true);
  SET LOCAL role = 'authenticated';

  UPDATE expenses SET description = 'hacked' WHERE id = :'sample_expense_id';
  SELECT 'EXPECT BLOCK: RESIDENT updates expense — rows affected should be 0' AS test;
ROLLBACK;


-- -------------------------------------------------------
-- 2.2  TREASURER tries to read audit logs
--      Expected: BLOCK (TREASURER has no audit.view — migration 022)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'treasurer_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT BLOCK (0 rows): TREASURER reads activity_logs' AS test,
         count(*) AS row_count
  FROM   activity_logs
  WHERE  rt_id = :'rt_a_id';
ROLLBACK;


-- -------------------------------------------------------
-- 2.3  RT_CHAIR tries to read audit logs
--      Expected: BLOCK (RT_CHAIR has no audit.view in default seed — migration 022)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'rt_chair_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT BLOCK (0 rows): RT_CHAIR reads activity_logs without audit.view' AS test,
         count(*) AS row_count
  FROM   activity_logs
  WHERE  rt_id = :'rt_a_id';
ROLLBACK;


-- -------------------------------------------------------
-- 2.4  TREASURER tries to update RT profile
--      Expected: BLOCK (TREASURER has no settings.update — migration 023)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'treasurer_id'), true);
  SET LOCAL role = 'authenticated';

  UPDATE rt SET updated_at = now() WHERE id = :'rt_a_id';
  SELECT 'EXPECT BLOCK: TREASURER updates RT profile — rows affected should be 0' AS test;
ROLLBACK;


-- -------------------------------------------------------
-- 2.5  Authenticated user tries to INSERT directly into ledger
--      Expected: BLOCK (ledger: create policy dropped — migration 024)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'treasurer_id'), true);
  SET LOCAL role = 'authenticated';

  INSERT INTO ledger (rt_id, type, source, reference_id, date, description, amount, balance_after, created_by)
  VALUES (:'rt_a_id', 'pemasukan', 'manual', gen_random_uuid(), now(), 'Direct insert attempt', 1000, 1000, :'treasurer_id');

  SELECT 'EXPECT BLOCK: Direct ledger INSERT should fail' AS test;
ROLLBACK;


-- -------------------------------------------------------
-- 2.6  Authenticated user tries to INSERT notification targeting another user
--      Expected: BLOCK (migration 025 — target_user_id must = auth.uid())
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'resident_id'), true);
  SET LOCAL role = 'authenticated';

  INSERT INTO notifications (rt_id, type, title, message, target_user_id)
  VALUES (:'rt_a_id', 'spam', 'Spam title', 'Spam body', :'treasurer_id');

  SELECT 'EXPECT BLOCK: Cross-user notification INSERT should fail' AS test;
ROLLBACK;


-- -------------------------------------------------------
-- 2.7  Authenticated user reads rt_permission_overrides for a different RT
--      Expected: BLOCK (permission.override is RT-scoped)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'rt_admin_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT BLOCK (0 rows): RT_ADMIN reads overrides for RT_B' AS test,
         count(*) AS row_count
  FROM   rt_permission_overrides
  WHERE  rt_id = :'rt_b_id';
ROLLBACK;


-- -------------------------------------------------------
-- 2.8  RESIDENT tries to read other users' notifications
--      Expected: BLOCK (notifications: read own — target_user_id = auth.uid())
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'resident_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT BLOCK (0 rows): RESIDENT reads notifications of TREASURER' AS test,
         count(*) AS row_count
  FROM   notifications
  WHERE  target_user_id = :'treasurer_id';
ROLLBACK;


-- ============================================================
-- SECTION 3 — Cross-Tenant Isolation (must BLOCK / return 0 rows)
-- ============================================================

-- -------------------------------------------------------
-- 3.1  RT_A admin reads residents from RT_B
--      Expected: BLOCK (has_permission scopes to membership RT)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'rt_admin_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT BLOCK (0 rows): RT_A admin reads RT_B residents' AS test,
         count(*) AS row_count
  FROM   residents
  WHERE  rt_id = :'rt_b_id';
ROLLBACK;


-- -------------------------------------------------------
-- 3.2  RT_A admin reads expenses from RT_B
--      Expected: BLOCK
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'rt_admin_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT BLOCK (0 rows): RT_A admin reads RT_B expenses' AS test,
         count(*) AS row_count
  FROM   expenses
  WHERE  rt_id = :'rt_b_id';
ROLLBACK;


-- -------------------------------------------------------
-- 3.3  RT_A admin tries to UPDATE RT_B profile
--      Expected: BLOCK (has_permission(id, settings.update) checks RT_B membership)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'rt_admin_id'), true);
  SET LOCAL role = 'authenticated';

  UPDATE rt SET updated_at = now() WHERE id = :'rt_b_id';
  SELECT 'EXPECT BLOCK: RT_A admin updates RT_B profile — rows affected should be 0' AS test;
ROLLBACK;


-- -------------------------------------------------------
-- 3.4  RT_A admin tries to INSERT resident into RT_B
--      Expected: BLOCK (has_permission checks RT_B membership, user has none)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'rt_admin_id'), true);
  SET LOCAL role = 'authenticated';

  INSERT INTO residents (rt_id, name) VALUES (:'rt_b_id', 'Cross-tenant injection attempt');
  SELECT 'EXPECT BLOCK: RT_A admin inserts resident into RT_B' AS test;
ROLLBACK;


-- -------------------------------------------------------
-- 3.5  RT_A admin reads ledger from RT_B
--      Expected: BLOCK
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'rt_admin_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT BLOCK (0 rows): RT_A admin reads RT_B ledger' AS test,
         count(*) AS row_count
  FROM   ledger
  WHERE  rt_id = :'rt_b_id';
ROLLBACK;


-- -------------------------------------------------------
-- 3.6  RT_A admin reads activity_logs from RT_B
--      Expected: BLOCK
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'rt_admin_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT BLOCK (0 rows): RT_A admin reads RT_B activity_logs' AS test,
         count(*) AS row_count
  FROM   activity_logs
  WHERE  rt_id = :'rt_b_id';
ROLLBACK;


-- -------------------------------------------------------
-- 3.7  RT_A admin reads rt_permission_overrides from RT_B
--      Expected: BLOCK
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'rt_admin_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT BLOCK (0 rows): RT_A admin reads RT_B permission overrides' AS test,
         count(*) AS row_count
  FROM   rt_permission_overrides
  WHERE  rt_id = :'rt_b_id';
ROLLBACK;


-- -------------------------------------------------------
-- 3.8  System RT logs are not visible to normal RT members
--      Expected: BLOCK (activity_logs: read own rt excludes system RT)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'rt_admin_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT BLOCK (0 rows): RT_ADMIN reads system RT activity_logs' AS test,
         count(*) AS row_count
  FROM   activity_logs
  WHERE  rt_id = :'system_rt_id';
ROLLBACK;


-- ============================================================
-- SECTION 4 — Anonymous Access (must BLOCK)
-- ============================================================

-- -------------------------------------------------------
-- 4.1  Anonymous user reads residents
--      Expected: BLOCK (residents RLS requires authenticated role)
-- -------------------------------------------------------
BEGIN;
  SET LOCAL role = 'anon';

  SELECT 'EXPECT BLOCK (0 rows or error): anon reads residents' AS test,
         count(*) AS row_count
  FROM   residents;
ROLLBACK;


-- -------------------------------------------------------
-- 4.2  Anonymous user reads ledger
--      Expected: BLOCK
-- -------------------------------------------------------
BEGIN;
  SET LOCAL role = 'anon';

  SELECT 'EXPECT BLOCK (0 rows or error): anon reads ledger' AS test,
         count(*) AS row_count
  FROM   ledger;
ROLLBACK;


-- -------------------------------------------------------
-- 4.3  Anonymous user reads notifications
--      Expected: BLOCK (read own requires auth.uid())
-- -------------------------------------------------------
BEGIN;
  SET LOCAL role = 'anon';

  SELECT 'EXPECT BLOCK (0 rows): anon reads notifications' AS test,
         count(*) AS row_count
  FROM   notifications;
ROLLBACK;


-- -------------------------------------------------------
-- 4.4  Anonymous user reads memberships
--      Expected: BLOCK (membership: read own requires auth.uid())
-- -------------------------------------------------------
BEGIN;
  SET LOCAL role = 'anon';

  SELECT 'EXPECT BLOCK (0 rows): anon reads memberships' AS test,
         count(*) AS row_count
  FROM   memberships;
ROLLBACK;


-- -------------------------------------------------------
-- 4.5  Anonymous user submits a registration request
--      Expected: PASS (registration: anyone can submit — anon access intentional)
-- -------------------------------------------------------
BEGIN;
  SET LOCAL role = 'anon';

  INSERT INTO registration_requests (type, status, rt_data)
  VALUES ('rt', 'pending', '{"name":"Test RT","code":"RT-9999"}');

  SELECT 'EXPECT PASS: anon submits registration request' AS test;
ROLLBACK;


-- ============================================================
-- SECTION 5 — Super Admin Bypass (must PASS)
-- ============================================================

-- -------------------------------------------------------
-- 5.1  SUPER_ADMIN reads memberships of all RTs
--      Expected: PASS (membership: super_admin read all)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'super_admin_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT PASS: SUPER_ADMIN reads all memberships' AS test,
         count(*) AS row_count
  FROM   memberships;
ROLLBACK;


-- -------------------------------------------------------
-- 5.2  SUPER_ADMIN reads activity_logs across all RTs
--      Expected: PASS (has_permission includes SUPER_ADMIN bypass)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'super_admin_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT PASS: SUPER_ADMIN reads all activity_logs' AS test,
         count(*) AS row_count
  FROM   activity_logs;
ROLLBACK;


-- -------------------------------------------------------
-- 5.3  SUPER_ADMIN updates RT profile of any RT
--      Expected: PASS (rt: members can update own rt uses has_permission
--                which includes the SUPER_ADMIN bypass after migration 023)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'super_admin_id'), true);
  SET LOCAL role = 'authenticated';

  UPDATE rt SET updated_at = now() WHERE id = :'rt_b_id';
  SELECT 'EXPECT PASS: SUPER_ADMIN updates any RT profile' AS test;
ROLLBACK;


-- ============================================================
-- SECTION 6 — Authorization Bypass / Permission Escalation
-- ============================================================

-- -------------------------------------------------------
-- 6.1  Authenticated user (no RT membership) reads residents
--      Expected: BLOCK (has_permission returns false — no matching membership)
-- -------------------------------------------------------
BEGIN;
  -- Use a UUID that has no membership rows in the test DB
  SELECT set_config('request.jwt.claims',
    '{"sub":"ffffffff-ffff-ffff-ffff-000000000000","role":"authenticated"}', true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT BLOCK (0 rows): user with no membership reads residents' AS test,
         count(*) AS row_count
  FROM   residents;
ROLLBACK;


-- -------------------------------------------------------
-- 6.2  JWT claim manipulation — user claims a rt_id in JWT
--      but has no memberships row matching it.
--      Expected: BLOCK (has_permission checks memberships table, not JWT claims)
-- -------------------------------------------------------
BEGIN;
  -- has_permission() ignores JWT custom claims; it reads memberships directly
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated","rt_id":"%s"}',
      :'resident_id', :'rt_b_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT BLOCK (0 rows): JWT rt_id claim injection has no effect' AS test,
         count(*) AS row_count
  FROM   expenses
  WHERE  rt_id = :'rt_b_id';
ROLLBACK;


-- -------------------------------------------------------
-- 6.3  Attempt to directly INSERT into rt_permission_overrides
--      without permission.override
--      Expected: BLOCK (RESIDENT has no permission.override)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'resident_id'), true);
  SET LOCAL role = 'authenticated';

  INSERT INTO rt_permission_overrides (rt_id, role_id, permission_id, allow)
  SELECT :'rt_a_id', r.id, p.id, true
  FROM   roles r, permissions p
  WHERE  r.code = 'RESIDENT' AND p.code = 'expense.delete';

  SELECT 'EXPECT BLOCK: RESIDENT inserts permission override' AS test;
ROLLBACK;


-- -------------------------------------------------------
-- 6.4  Attempt to INSERT a membership row as RT_ADMIN
--      Expected: PASS after migration 021 (RT_ADMIN has membership.create)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'rt_admin_id'), true);
  SET LOCAL role = 'authenticated';

  -- Note: this test validates that RT_ADMIN CAN now insert memberships
  -- (this was the design gap closed by migration 021)
  INSERT INTO memberships (user_id, rt_id, role, status)
  VALUES (gen_random_uuid(), :'rt_a_id', 'RESIDENT', 'active');

  SELECT 'EXPECT PASS: RT_ADMIN inserts membership in own RT' AS test;
ROLLBACK;


-- -------------------------------------------------------
-- 6.5  RT_A admin tries to INSERT membership into RT_B
--      Expected: BLOCK (membership.create only valid for own RT)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'rt_admin_id'), true);
  SET LOCAL role = 'authenticated';

  INSERT INTO memberships (user_id, rt_id, role, status)
  VALUES (gen_random_uuid(), :'rt_b_id', 'RESIDENT', 'active');

  SELECT 'EXPECT BLOCK: RT_A admin inserts membership into RT_B' AS test;
ROLLBACK;


-- -------------------------------------------------------
-- 6.6  Attempt to call approve_all_pending_expenses as authenticated user
--      Expected: BLOCK after migration 027 (restricted to service_role)
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'rt_admin_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT approve_all_pending_expenses(:'rt_a_id', :'rt_admin_id');
  SELECT 'EXPECT BLOCK/ERROR: authenticated user calls approve_all_pending_expenses' AS test;
ROLLBACK;


-- ============================================================
-- SECTION 7 — SECURITY DEFINER Function Execution Context
-- ============================================================

-- -------------------------------------------------------
-- 7.1  has_permission() returns false for user with no membership
--      Expected: false
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    '{"sub":"ffffffff-ffff-ffff-ffff-000000000000","role":"authenticated"}', true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT false: has_permission for user with no membership' AS test,
         has_permission('00000000-0000-0000-0000-000000000aa1', 'resident.view') AS result;
ROLLBACK;


-- -------------------------------------------------------
-- 7.2  is_super_admin() returns false for regular user
--      Expected: false
-- -------------------------------------------------------
BEGIN;
  SELECT set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', :'resident_id'), true);
  SET LOCAL role = 'authenticated';

  SELECT 'EXPECT false: is_super_admin for RESIDENT' AS test,
         is_super_admin() AS result;
ROLLBACK;


-- -------------------------------------------------------
-- 7.3  Verify anon cannot execute is_super_admin() after migration 027
--      Expected: permission denied error
-- -------------------------------------------------------
BEGIN;
  SET LOCAL role = 'anon';

  SELECT is_super_admin() AS result;
  -- If migration 027 is applied, this should raise "permission denied"
  SELECT 'EXPECT ERROR: anon calls is_super_admin()' AS test;
ROLLBACK;


-- ============================================================
-- END OF VALIDATION SUITE
-- ============================================================
--
-- After running, review:
--   * Any PASS test that returned 0 rows     → policy may be too restrictive
--   * Any BLOCK test that returned > 0 rows  → policy has a gap
--   * Any BLOCK test that did not raise an error when an error was expected
--     → check the WITH CHECK expression
--
-- Refer to docs/rbac/RLS_VALIDATION_REPORT.md for full analysis.
-- ============================================================
