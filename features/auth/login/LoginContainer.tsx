'use client'

import {
  useLogin
} from './hooks/useLogin'

import LoginView
  from './LoginView'

export default function LoginContainer() {

  const login =
    useLogin({

      onSuccess() {

        window.location.href = '/'
      }

    })

  return (
    <LoginView
      {...login}
    />
  )
}