// @ts-nocheck
'use client'

import {
  useState
} from 'react'

import {
  loginWithPassword
} from '../../../../lib/services/auth.service'

export function useLogin({

  onSuccess

}) {

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
    e
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
        err.message
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