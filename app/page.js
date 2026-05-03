'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')

  const login = async () => {
    await supabase.auth.signInWithOtp({ email })
    alert('Cek email untuk login')
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>KasWarga Login</h2>
      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={login}>Login</button>
    </div>
  )
}