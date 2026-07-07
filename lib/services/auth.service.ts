import {
  supabase
} from '../supabase'

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

export async function loginWithPassword({
  email,
  password
}: {
  email: string
  password: string
}): Promise<true> {

  const {
    error
  } =
    await supabase
      .auth
      .signInWithPassword({

        email,
        password

      })

  if (error) {

    throw error
  }

  return true
}

/*
|--------------------------------------------------------------------------
| CHANGE PASSWORD
|--------------------------------------------------------------------------
*/

export async function changePassword(newPassword: string): Promise<true> {

  const { error } =
    await supabase
      .auth
      .updateUser({ password: newPassword })

  if (error) throw error

  return true
}

/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

export async function logout(): Promise<true> {

  const {
    error
  } =
    await supabase
      .auth
      .signOut()

  if (error) {

    throw error
  }

  return true
}