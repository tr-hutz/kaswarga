import {
  supabase
} from '@/lib/supabase'

/*
|--------------------------------------------------------------------------
| GET CURRENT MEMBERSHIP
|--------------------------------------------------------------------------
|
| Return:
| {
|   id,
|   role,
|   user,
|   rt,
|   warga
| }
|
| Multi-RT ready
|--------------------------------------------------------------------------
*/

export async function getCurrentMembership() {

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

    throw new Error(
      'Membership not found'
    )
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
    !membership.rt?.id
  ) {

    throw new Error(
      'RT not found'
    )
  }

  /*
   |--------------------------------------------------------------------------
   | NORMALIZED RETURN
   |--------------------------------------------------------------------------
   */

  return {

    id:
      membership.id,

    role:
      membership.role,

    user:
      membership.user || null,

    rt:
      membership.rt || null,

    warga:
      membership.warga || null

  }
}