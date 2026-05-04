'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

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
      .single()

    if (data?.role === 'admin') {
      window.location.href = '/admin/pembayaran'
    } else {
      window.location.href = '/warga'
    }
  }

  const register = async () => {
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password
    })

    setLoading(false)

    if (error) return alert(error.message)

    alert('User berhasil dibuat, sekarang login')

    // ⚠️ penting: insert ke tabel users
    await supabase.from('users').insert({
      id: data.user.id,
      nama: email,
      role: 'warga'
    })
  }

  const login = async () => {
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })

    setLoading(false)

    if (error) return alert(error.message)

    handleRedirect(data.user.id)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>KasWarga Login</h2>

      <input
        type="email"
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

      <button onClick={login} disabled={loading}>
        Login
      </button>

      <button onClick={register} disabled={loading}>
        Register
      </button>
    </div>
  )
}