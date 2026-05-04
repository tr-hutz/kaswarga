'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      handleRedirect(data.user.id)
    }
  }

  const handleRedirect = async (userId) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (data?.role === 'admin') {
      window.location.href = '/admin/pembayaran'
    } else {
      window.location.href = '/warga'
    }
  }

  const register = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password
    })

    if (error) return alert(error.message)

    await supabase.from('users').insert({
      id: data.user.id,
      nama: email,
      role: 'warga'
    })

    alert('Register sukses')
  }

  const login = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    })

    if (error) return alert(error.message)

    handleRedirect(data.user.id)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>KasWarga</h2>

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={login}>Login</button>
      <button onClick={register}>Register</button>
    </div>
  )
}