'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  useState,
  type FormEvent
} from 'react'

import {
  loginWithPassword
} from '@/lib/services/auth.service'

export function useLogin({

  onSuccess

}: { onSuccess?: () => void } = {}) {

  /*
   |--------------------------------------------------------------------------
   | STATE
   |--------------------------------------------------------------------------
   */

  const [
    loading,
    setLoading
  ] = useState(false)

  const [
    email,
    setEmail
  ] = useState('')

  const [
    password,
    setPassword
  ] = useState('')

  const [
    error,
    setError
  ] = useState('')

  /*
   |--------------------------------------------------------------------------
   | SUBMIT
   |--------------------------------------------------------------------------
   */

  async function handleSubmit(
    e: FormEvent
  ) {

    e.preventDefault()

    try {

      setLoading(true)
      setError('')

      await loginWithPassword({

        email,
        password
      })

      onSuccess?.()

    } catch (err) {

      setError(
        (err as any).message ?? 'Login failed'
      )

    } finally {

      setLoading(false)
    }
  }

  /*
   |--------------------------------------------------------------------------
   | RETURN
   |--------------------------------------------------------------------------
   */

  return {

    loading,

    email,
    setEmail,

    password,
    setPassword,

    error,

    handleSubmit

  }
}