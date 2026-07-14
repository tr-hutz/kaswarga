/*
 * =============================================================================
 * 011_RLS_TIGHTEN
 * Tighten overly permissive RLS policies added in 007_rls.
 *
 * Changes:
 *   registration_requests  — UPDATE/DELETE were using (true); now scoped to
 *                            SUPER_ADMIN for type='rt' and to ADMIN/CHAIR of the
 *                            same RT for type='resident'.
 *
 *   activation_invites     — SELECT was open to anon/authenticated using (true);
 *                            now restricted to SUPER_ADMIN and ADMIN/CHAIR of the
 *                            invite's RT. INSERT/UPDATE are dropped entirely —
 *                            all writes go through supabase_admin (service_role)
 *                            which bypasses RLS, so no authenticated policy is needed.
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * REGISTRATION REQUESTS — tighten UPDATE and DELETE
 * --------------------------------------------------------------------------- */

drop policy "registration: authenticated can update" on registration_requests;
drop policy "registration: authenticated can delete" on registration_requests;

-- Only SUPER_ADMIN may update RT registration requests.
-- Only ADMIN or CHAIR of the same RT may update resident registration requests.
create policy "registration: authorized can update"
    on registration_requests for update to authenticated
    using (
        (type = 'rt' and is_super_admin())
        or (
            type  = 'resident'
            and rt_id in (
                select rt_id
                from   memberships
                where  user_id = auth.uid()
                and    role    in ('ADMIN', 'CHAIR')
                and    status  = 'active'
            )
        )
    );

-- Mirror the UPDATE restriction for hard-deletes (rejected resident requests).
create policy "registration: authorized can delete"
    on registration_requests for delete to authenticated
    using (
        (type = 'rt' and is_super_admin())
        or (
            type  = 'resident'
            and rt_id in (
                select rt_id
                from   memberships
                where  user_id = auth.uid()
                and    role    in ('ADMIN', 'CHAIR')
                and    status  = 'active'
            )
        )
    );


/* ----------------------------------------------------------------------------
 * ACTIVATION INVITES — tighten SELECT, remove INSERT/UPDATE
 * --------------------------------------------------------------------------- */

drop policy "activation_invites: anyone can read"      on activation_invites;
drop policy "activation_invites: authenticated can insert" on activation_invites;
drop policy "activation_invites: authenticated can update" on activation_invites;

-- SUPER_ADMIN can read all invites (RT registration management page).
-- ADMIN/CHAIR can read invites for their own RT (resend-invite flows).
create policy "activation_invites: authorized can read"
    on activation_invites for select to authenticated
    using (
        is_super_admin()
        or rt_id in (
            select rt_id
            from   memberships
            where  user_id = auth.uid()
            and    role    in ('ADMIN', 'CHAIR')
            and    status  = 'active'
        )
    );
