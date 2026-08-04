/*
 * =============================================================================
 * 014_RBAC_RLS
 *
 * Migrates RLS policies from hardcoded role-name checks to permission-based
 * checks using has_permission() from 013_rbac_functions.
 *
 * Old pattern: role IN ('ADMIN', 'CHAIR') or rt_id IN (get_user_rt_ids())
 * New pattern: has_permission(rt_id, 'module.action')
 *
 * has_permission() already incorporates the SUPER_ADMIN bypass, so the
 * OR is_super_admin() guard is dropped except where the operation is
 * explicitly SUPER_ADMIN-only at the platform level.
 *
 * Tables updated:
 *   residents, payment_confirmations, confirmation_details,
 *   payments, payment_details, expenses, ledger,
 *   registration_requests, activation_invites
 *
 * Tables left unchanged (no role-name checks; RT isolation remains correct):
 *   rt, users, memberships, notifications, activity_logs
 *
 * Dependencies : 013_rbac_functions (has_permission)
 * =============================================================================
 */


/* ============================================================================
 * RESIDENTS
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

CREATE POLICY "residents: delete"
    ON residents FOR DELETE TO authenticated
    USING (has_permission(rt_id, 'resident.delete'));


/* ============================================================================
 * PAYMENT_CONFIRMATIONS
 * ============================================================================ */

DROP POLICY IF EXISTS "konfirmasi: read own rt"   ON payment_confirmations;
DROP POLICY IF EXISTS "konfirmasi: insert own rt" ON payment_confirmations;
DROP POLICY IF EXISTS "konfirmasi: update own rt" ON payment_confirmations;

CREATE POLICY "payment_confirmations: view"
    ON payment_confirmations FOR SELECT TO authenticated
    USING (has_permission(rt_id, 'payment.view'));

CREATE POLICY "payment_confirmations: create"
    ON payment_confirmations FOR INSERT TO authenticated
    WITH CHECK (has_permission(rt_id, 'payment.create'));

CREATE POLICY "payment_confirmations: update"
    ON payment_confirmations FOR UPDATE TO authenticated
    USING     (has_permission(rt_id, 'payment.view'))
    WITH CHECK (has_permission(rt_id, 'payment.view'));


/* ============================================================================
 * CONFIRMATION_DETAILS
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
 * ============================================================================ */

DROP POLICY IF EXISTS "pembayaran: read own rt"   ON payments;
DROP POLICY IF EXISTS "pembayaran: insert own rt" ON payments;

CREATE POLICY "payments: view"
    ON payments FOR SELECT TO authenticated
    USING (has_permission(rt_id, 'payment.view'));

CREATE POLICY "payments: create"
    ON payments FOR INSERT TO authenticated
    WITH CHECK (has_permission(rt_id, 'payment.create'));


/* ============================================================================
 * PAYMENT_DETAILS
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

CREATE POLICY "expenses: delete"
    ON expenses FOR DELETE TO authenticated
    USING (has_permission(rt_id, 'expense.delete'));


/* ============================================================================
 * LEDGER
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
 * RT-type requests remain SUPER_ADMIN-only (platform operation).
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
 * ============================================================================ */

DROP POLICY IF EXISTS "activation_invites: authorized can read" ON activation_invites;

CREATE POLICY "activation_invites: view"
    ON activation_invites FOR SELECT TO authenticated
    USING (
        is_super_admin()
        OR has_permission(rt_id, 'settings.view')
    );
