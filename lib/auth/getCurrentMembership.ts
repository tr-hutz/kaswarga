import { supabase } from '@/lib/supabase'
import type { Membership } from '../../types'

export async function getCurrentMembership(): Promise<Membership> {

  /*
   |--------------------------------------------------------------------------
   | AUTH USER
   |--------------------------------------------------------------------------
   */

  const {
    data: authData,
    error: authError
  } =
    await supabase.auth.getUser()

  if (
    authError ||
    !authData?.user
  ) {

    throw new Error(
      'Unauthorized'
    )
  }

  const authUser =
    authData.user

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
   | NO MEMBERSHIP
   |--------------------------------------------------------------------------
   */

  if (
    !memberships ||
    memberships.length === 0
  ) {

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
   | TODO:
   | future multi-RT selector
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
