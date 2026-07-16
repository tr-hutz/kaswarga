'use client'

import {
  useRouter
} from 'next/navigation'

import {
  useLogin
} from './hooks/useLogin'

import LoginView
  from './LoginView'

export default function LoginContainer() {

  const router =
    useRouter()

  const login =
    useLogin({

      onSuccess() {

        router.push('/')
      }

    })

  return (
    <LoginView
      {...login}
    />
  )
}