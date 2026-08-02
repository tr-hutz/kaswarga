/*
 * =============================================================================
 * 025_NOTIFICATIONS_INSERT_POLICY
 *
 * Replaces the wildcard 'notifications: authenticated can insert' policy
 * with a scoped check that prevents cross-user notification spam.
 *
 * Assessment finding (Sprint 5.1):
 *   The existing policy has WITH CHECK (true), which allows any authenticated
 *   user to INSERT a notification targeting any target_user_id in any RT.
 *   This was originally needed when notification inserts were performed via
 *   the authenticated Supabase client (browser). After Sprint 4:
 *     - Payment notifications  → /api/payments/notify (supabaseAdmin)
 *     - Expense notifications  → /api/expenses/approve|reject (supabaseAdmin)
 *     - In-DB notifications    → approve_confirmation, reject_confirmation
 *                                (SECURITY DEFINER, bypasses RLS)
 *   All notification INSERT paths now bypass RLS via service_role or
 *   SECURITY DEFINER. The permissive authenticated INSERT policy is no longer
 *   required and is an open attack surface.
 *
 * New policy:
 *   WITH CHECK (target_user_id = auth.uid() OR is_super_admin())
 *   Allows users to insert self-targeted notifications (future self-service
 *   use cases, e.g., reminders) and preserves SUPER_ADMIN access.
 *   Prevents any authenticated user from spamming other users.
 *
 * Compatibility note:
 *   If any future feature inserts notifications client-side (authenticated
 *   client, not supabaseAdmin), it must target auth.uid() or run server-side.
 *   Document this constraint before adding client-side notification logic.
 *
 * Dependencies : 007_rls (notifications: authenticated can insert)
 * =============================================================================
 */


ALTER POLICY "notifications: authenticated can insert"
    ON notifications
    WITH CHECK (target_user_id = auth.uid() OR is_super_admin());
