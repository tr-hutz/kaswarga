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

/*
|--------------------------------------------------------------------------
| SESSION
|--------------------------------------------------------------------------
*/

export async function getAuthSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function exchangeCodeForSession(code: string): Promise<void> {
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) throw error
}

export async function setAuthSession(accessToken: string, refreshToken: string): Promise<void> {
  const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
  if (error) throw error
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}