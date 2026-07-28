/*
 * =============================================================================
 * 019_UPDATE_RLS_POLICIES
 *
 * Migrates RLS policies from role-name checks to permission-based checks.
 *
 * Old pattern: role IN ('ADMIN', 'CHAIR') or rt_id IN (get_user_rt_ids())
 * New pattern: has_permission(rt_id, 'module.action')
 *
 * has_permission() already incorporates the SUPER_ADMIN bypass, so the
 * OR is_super_admin() guard is dropped from policies except where the
 * operation is explicitly SUPER_ADMIN-only at the platform level (e.g.
 * updating RT-type registration requests).
 *
 * Tables updated
 *   residents, payment_confirmations, confirmation_details,
 *   payments, payment_details, expenses, ledger,
 *   registration_requests, activation_invites
 *
 * Tables left unchanged (no role-name checks; RT isolation remains correct)
 *   rt, users, memberships, notifications, activity_logs
 *
 * Stored functions (approve_confirmation, reject_confirmation, approve_expense)
 * retain their own role checks until Phase 4 (PermissionService) lands.
 *
 * Dependencies : 018_rbac_authorization_functions (has_permission)
 * =============================================================================
 */


/* ============================================================================
 * RESIDENTS
 *
 * Old: rt_id in (get_user_rt_ids()) — any active member
 * New: scoped by resident.X permission
 * ============================================================================ */

DROP POLICY IF EXISTS "warga: read own rt"  ON residents;
DROP POLICY IF EXISTS "warga: insert own rt" ON residents;
DROP POLICY IF EXISTS "warga: update own rt" ON residents;

CREATE POLICY "residents: view"
    ON residents FOR SELECT TO authenticated
    USING (has_permission(rt_id, 'resident.view'));

CREATE POLICY "residents: create"
    ON residents FOR INSERT TO authenticated
    WITH CHECK (has_permission(rt_id, 'resident.create'));

CREATE POLICY "residents: update"
    ON residents FOR UPDATE TO authenticated
    USING     (has_permission(rt_id, 'resident.update'))
    WITH CHECK (has_permission(rt_id, 'resident.update'));

-- No delete policy existed before; add the RBAC v2 guard now.
CREATE POLICY "residents: delete"
    ON residents FOR DELETE TO authenticated
    USING (has_permission(rt_id, 'resident.delete'));


/* ============================================================================
 * PAYMENT_CONFIRMATIONS
 *
 * Old: rt_id in (get_user_rt_ids()) / is_member_of_rt(rt_id) — any member
 * New: payment.view for SELECT/UPDATE, payment.create for INSERT
 * ============================================================================ */

DROP POLICY IF EXISTS "konfirmasi: read own rt"   ON payment_confirmations;
DROP POLICY IF EXISTS "konfirmasi: insert own rt" ON payment_confirmations;
DROP POLICY IF EXISTS "konfirmasi: update own rt" ON payment_confirmations;

CREATE POLICY "payment_confirmations: view"
    ON payment_confirmations FOR SELECT TO authenticated
    USING (has_permission(rt_id, 'payment.view'));

-- Residents submit their own confirmations; RESIDENT role has payment.create.
CREATE POLICY "payment_confirmations: create"
    ON payment_confirmations FOR INSERT TO authenticated
    WITH CHECK (has_permission(rt_id, 'payment.create'));

-- approve_confirmation / reject_confirmation (SECURITY DEFINER) are the normal
-- UPDATE path; this policy guards direct client writes.
CREATE POLICY "payment_confirmations: update"
    ON payment_confirmations FOR UPDATE TO authenticated
    USING     (has_permission(rt_id, 'payment.view'))
    WITH CHECK (has_permission(rt_id, 'payment.view'));


/* ============================================================================
 * CONFIRMATION_DETAILS
 *
 * No direct rt_id — scoped through parent payment_confirmations.
 * ============================================================================ */

DROP POLICY IF EXISTS "detail konfirmasi: read own rt"   ON confirmation_details;
DROP POLICY IF EXISTS "detail konfirmasi: insert own rt" ON confirmation_details;

CREATE POLICY "confirmation_details: view"
    ON confirmation_details FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM payment_confirmations pc
            WHERE  pc.id = confirmation_id
            AND    has_permission(pc.rt_id, 'payment.view')
        )
    );

CREATE POLICY "confirmation_details: create"
    ON confirmation_details FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM payment_confirmations pc
            WHERE  pc.id = confirmation_id
            AND    has_permission(pc.rt_id, 'payment.create')
        )
    );


/* ============================================================================
 * PAYMENTS
 *
 * Approved payment rows are immutable; no UPDATE policy is added (preserved
 * from original design).
 * ============================================================================ */

DROP POLICY IF EXISTS "pembayaran: read own rt"   ON payments;
DROP POLICY IF EXISTS "pembayaran: insert own rt" ON payments;

CREATE POLICY "payments: view"
    ON payments FOR SELECT TO authenticated
    USING (has_permission(rt_id, 'payment.view'));

-- approve_confirmation (SECURITY DEFINER) is the normal INSERT path.
CREATE POLICY "payments: create"
    ON payments FOR INSERT TO authenticated
    WITH CHECK (has_permission(rt_id, 'payment.create'));


/* ============================================================================
 * PAYMENT_DETAILS
 *
 * No direct rt_id — scoped through parent payments.
 * ============================================================================ */

DROP POLICY IF EXISTS "detail pembayaran: read own rt"   ON payment_details;
DROP POLICY IF EXISTS "detail pembayaran: insert own rt" ON payment_details;

CREATE POLICY "payment_details: view"
    ON payment_details FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM payments p
            WHERE  p.id = payment_id
            AND    has_permission(p.rt_id, 'payment.view')
        )
    );

CREATE POLICY "payment_details: create"
    ON payment_details FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM payments p
            WHERE  p.id = payment_id
            AND    has_permission(p.rt_id, 'payment.create')
        )
    );


/* ============================================================================
 * EXPENSES
 *
 * Old: rt_id in (get_user_rt_ids()) / is_member_of_rt(rt_id) — any member
 * New: scoped by expense.X permission
 * approve_expense / reject_expense (SECURITY DEFINER) are the normal UPDATE
 * path; the UPDATE policy here is a defence-in-depth guard.
 * ============================================================================ */

DROP POLICY IF EXISTS "pengeluaran: read own rt"   ON expenses;
DROP POLICY IF EXISTS "pengeluaran: insert own rt" ON expenses;
DROP POLICY IF EXISTS "pengeluaran: update own rt" ON expenses;

CREATE POLICY "expenses: view"
    ON expenses FOR SELECT TO authenticated
    USING (has_permission(rt_id, 'expense.view'));

CREATE POLICY "expenses: create"
    ON expenses FOR INSERT TO authenticated
    WITH CHECK (has_permission(rt_id, 'expense.create'));

CREATE POLICY "expenses: update"
    ON expenses FOR UPDATE TO authenticated
    USING     (has_permission(rt_id, 'expense.update'))
    WITH CHECK (has_permission(rt_id, 'expense.update'));

-- No delete policy existed before; add the RBAC v2 guard now.
CREATE POLICY "expenses: delete"
    ON expenses FOR DELETE TO authenticated
    USING (has_permission(rt_id, 'expense.delete'));


/* ============================================================================
 * LEDGER
 *
 * Old: rt_id in (get_user_rt_ids()) — any active member
 * New: ledger.view permission
 * insert_ledger() is SECURITY DEFINER and the only write path — the INSERT
 * policy below is a defence-in-depth guard for direct client writes.
 * ============================================================================ */

DROP POLICY IF EXISTS "ledger: read own rt"   ON ledger;
DROP POLICY IF EXISTS "ledger: insert own rt" ON ledger;

CREATE POLICY "ledger: view"
    ON ledger FOR SELECT TO authenticated
    USING (has_permission(rt_id, 'ledger.view'));

CREATE POLICY "ledger: create"
    ON ledger FOR INSERT TO authenticated
    WITH CHECK (has_permission(rt_id, 'ledger.view'));


/* ============================================================================
 * REGISTRATION_REQUESTS
 *
 * Old: role IN ('ADMIN', 'CHAIR') — hardcoded role names
 * New: resident.view / resident.approve permission
 *
 * RT-type requests remain SUPER_ADMIN-only (platform operation, no RT
 * membership applies). has_permission() would also return true for
 * SUPER_ADMIN but the explicit is_super_admin() guard makes the intent clear.
 * ============================================================================ */

DROP POLICY IF EXISTS "registration: admin read resident requests for own rt" ON registration_requests;
DROP POLICY IF EXISTS "registration: authorized can update"                   ON registration_requests;
DROP POLICY IF EXISTS "registration: authorized can delete"                   ON registration_requests;

CREATE POLICY "registration_requests: view resident"
    ON registration_requests FOR SELECT TO authenticated
    USING (
        type = 'resident'
        AND has_permission(rt_id, 'resident.view')
    );

CREATE POLICY "registration_requests: update"
    ON registration_requests FOR UPDATE TO authenticated
    USING (
        (type = 'rt'       AND is_super_admin())
        OR (type = 'resident' AND has_permission(rt_id, 'resident.approve'))
    );

CREATE POLICY "registration_requests: delete"
    ON registration_requests FOR DELETE TO authenticated
    USING (
        (type = 'rt'       AND is_super_admin())
        OR (type = 'resident' AND has_permission(rt_id, 'resident.approve'))
    );


/* ============================================================================
 * ACTIVATION_INVITES
 *
 * Old: is_super_admin() OR role IN ('ADMIN', 'CHAIR')
 * New: is_super_admin() OR settings.view permission
 * ============================================================================ */

DROP POLICY IF EXISTS "activation_invites: authorized can read" ON activation_invites;

CREATE POLICY "activation_invites: view"
    ON activation_invites FOR SELECT TO authenticated
    USING (
        is_super_admin()
        OR has_permission(rt_id, 'settings.view')
    );
