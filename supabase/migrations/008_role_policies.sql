/*
|--------------------------------------------------------------------------
| HELPER: check if the currently authenticated user is super_admin
|
| SECURITY DEFINER bypasses RLS, preventing circular dependency when the
| function itself queries the user_membership table.
|--------------------------------------------------------------------------
*/

create or replace function is_super_admin()
returns boolean
language sql
security definer
stable
as $$
    select exists (
        select 1
        from   user_membership
        where  user_id = auth.uid()
        and    role    = 'super_admin'
    )
$$;

/*
|--------------------------------------------------------------------------
| RT — write policies
| Read-only policy already exists ("Allow read rt" — using true).
|--------------------------------------------------------------------------
*/

create policy "Allow insert rt"
    on rt
    for insert
    to authenticated
    with check (true);

create policy "Allow update rt"
    on rt
    for update
    to authenticated
    using (true);

create policy "Allow delete rt"
    on rt
    for delete
    to authenticated
    using (true);

/*
|--------------------------------------------------------------------------
| USER MEMBERSHIP — extend read + add write policies
|
| Existing policy "membership_select_own" allows each user to see their
| own memberships (user_id = auth.uid()).  We add a second permissive
| policy so super_admin can read all memberships (policies are OR-ed).
|--------------------------------------------------------------------------
*/

create policy "super_admin can read all memberships"
    on user_membership
    for select
    to authenticated
    using (is_super_admin());

create policy "super_admin can insert membership"
    on user_membership
    for insert
    to authenticated
    with check (is_super_admin());

create policy "super_admin can update membership"
    on user_membership
    for update
    to authenticated
    using (is_super_admin());

create policy "super_admin can delete membership"
    on user_membership
    for delete
    to authenticated
    using (is_super_admin());
