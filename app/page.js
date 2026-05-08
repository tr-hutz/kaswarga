'use client'
import { useState } from 'react'
import Button from '../components/Button'
import Input from '../components/Input'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async () => {
    if (!email || !password) {
      return alert('Isi email & password')
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    window.location.href = '/home'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-sm">

        <h1 className="text-xl font-bold mb-4 text-center">
          Login Warga
        </h1>

        <div className="space-y-3">

          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            onClick={login}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Login'}
          </Button>

        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          KasWargi
        </p>
      </div>
    </div>
  )
}