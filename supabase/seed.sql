/*
 * =============================================================================
 * SEED  (base — always runs with supabase db reset)
 *
 * Creates only the SUPER_ADMIN user.
 * The auth user is created separately via: npm run seed:auth
 *
 * For full dev sample data (RT, residents, memberships, all auth users):
 *   npm run seed:dev
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * SUPER_ADMIN user
 * --------------------------------------------------------------------------- */

insert into users (id, name, email, created_at)
values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Super Admin', 'superuser@nodomain.com', now())
on conflict (id) do nothing;

insert into memberships (user_id, rt_id, role)
values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '00000000-0000-0000-0000-000000000001', 'SUPER_ADMIN')
on conflict (user_id, rt_id) do nothing;