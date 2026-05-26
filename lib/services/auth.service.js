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

}) {

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
| LOGOUT
|--------------------------------------------------------------------------
*/

export async function logout() {

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