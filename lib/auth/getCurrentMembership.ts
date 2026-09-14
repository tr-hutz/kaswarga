import { supabase } from '@/lib/supabase'
import type { Membership } from '@/types'

export async function getCurrentMembership(): Promise<Membership> {

  /*
   |--------------------------------------------------------------------------
   | AUTH USER
   |--------------------------------------------------------------------------
   */

  // getSession() auto-refreshes an expired access token using the stored refresh token.
  // getUser() makes a live server call and returns 401 immediately if the access token
  // is expired — causing auth to break until the background refresh completes.
  const {
    data: { session },
    error: sessionError
  } =
    await supabase.auth.getSession()

  if (
    sessionError ||
    !session?.user
  ) {

    throw new Error(
      'Unauthorized'
    )
  }

  const authUser =
    session.user

  /*
   |--------------------------------------------------------------------------
   | MEMBERSHIP QUERY
   |--------------------------------------------------------------------------
   */

  const {
    data: memberships,
    error: membershipError
  } =
    await supabase

      .from(
        'memberships'
      )

      .select(`
        id,
        role,

        user:users (
          id,
          name,
          email
        ),

        rt:rt (
          id,
          name,
          code,
          monthly_fee
        ),

        resident:residents (
          id,
          name,
          block,
          house_number,
          rt_id
        )
      `)

      .eq(
        'user_id',
        authUser.id
      )

      .eq(
        'status',
        'active'
      )

  if (membershipError) {

    console.error(
      '[getCurrentMembership]',
      membershipError
    )

    throw membershipError
  }

  /*
   |--------------------------------------------------------------------------
   | NO ACTIVE MEMBERSHIP — check for SUPER_ADMIN before giving up
   |--------------------------------------------------------------------------
   |
   | SUPER_ADMIN accounts are created outside the normal invitation flow and
   | may have a non-active status. Fall back to a status-agnostic query so
   | they are never blocked by the no_membership screen.
   |--------------------------------------------------------------------------
   */

  if (!memberships || memberships.length === 0) {

    const { data: superAdmin } = await supabase
      .from('memberships')
      .select(`
        id,
        role,
        user:users (
          id,
          name,
          email
        )
      `)
      .eq('user_id', authUser.id)
      .eq('role', 'SUPER_ADMIN')
      .maybeSingle()

    if (superAdmin) {
      return {
        id:       superAdmin.id,
        role:     'SUPER_ADMIN',
        user:     (superAdmin.user as Membership['user']) || null,
        rt:       null,
        resident: null,
        status:   'active'
      }
    }

    return {
      id:       null,
      role:     null,
      user:     { id: authUser.id, email: authUser.email ?? null, name: null },
      rt:       null,
      resident: null,
      status:   'no_membership'
    }
  }

  /*
   |--------------------------------------------------------------------------
   | ACTIVE MEMBERSHIP
   |--------------------------------------------------------------------------
   |
   | multi-RT selector
   |--------------------------------------------------------------------------
   */

  const membership =
    memberships[0]

  /*
   |--------------------------------------------------------------------------
   | SAFETY VALIDATION
   |--------------------------------------------------------------------------
   */

  if (
    membership.role !== 'SUPER_ADMIN' &&
    !membership.rt?.id
  ) {

    throw new Error(
      'RT tidak ditemukan'
    )
  }

  /*
   |--------------------------------------------------------------------------
   | NORMALIZED RETURN
   |--------------------------------------------------------------------------
   */

  return {
    id:       membership.id,
    role:     membership.role as Membership['role'],
    user:     (membership.user as Membership['user']) || null,
    rt:       (membership.rt as Membership['rt']) || null,
    resident: (membership.resident as Membership['resident']) || null,
    status:   'active'
  }
}
