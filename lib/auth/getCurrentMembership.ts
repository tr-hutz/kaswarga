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
        'user_membership'
      )

      .select(`
        id,
        role,

        user:users (
          id,
          nama,
          email
        ),

        rt:rt (
          id,
          nama,
          kode,
          nominal_iuran
        ),

        warga:warga (
          id,
          nama,
          blok,
          no_rumah,
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
      id:     null,
      role:   null,
      user:   { id: authUser.id, email: authUser.email ?? null, nama: null },
      rt:     null,
      warga:  null,
      status: 'no_membership'
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
    membership.role !== 'super_admin' &&
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
    id:     membership.id,
    role:   membership.role as Membership['role'],
    user:   (membership.user as Membership['user']) || null,
    rt:     (membership.rt as Membership['rt']) || null,
    warga:  (membership.warga as Membership['warga']) || null,
    status: 'active'
  }
}