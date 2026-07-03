'use client'

import Link from 'next/link'
import { LogIn } from 'lucide-react'

export default function LoginView({

  loading,

  email,
  setEmail,

  password,
  setPassword,

  error,

  handleSubmit

}) {

  return (

    <div
      className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-gray-100
        px-4
      "
    >

      <div
        className="
          w-full
          max-w-md
          bg-white
          rounded-2xl
          shadow-sm
          border
          p-8
        "
      >

        {/* HEADER */}

        <div
          className="
            text-center
            mb-8
          "
        >

          <div
            className="
              inline-flex
              items-center
              justify-center
              w-14
              h-14
              rounded-2xl
              bg-blue-100
              text-blue-700
              mb-4
            "
          >

            <LogIn size={28} />

          </div>

          <h1
            className="
              text-2xl
              font-bold
            "
          >
            Login Kas Warga
          </h1>

          <p
            className="
              text-sm
              text-gray-500
              mt-2
            "
          >
            Masuk ke sistem iuran warga
          </p>

        </div>

        {/* ERROR */}

        {
          error && (

            <div
              className="
                mb-4
                rounded-xl
                bg-red-50
                border
                border-red-200
                text-red-700
                px-4
                py-3
                text-sm
              "
            >

              {error}

            </div>

          )
        }

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="
            space-y-5
          "
        >

          {/* EMAIL */}

          <div>

            <label
              className="
                block
                text-sm
                font-medium
                mb-2
              "
            >
              Email
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={e =>
                setEmail(
                  e.target.value
                )
              }
              className="
                w-full
                border
                rounded-xl
                px-4
                py-3
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
              placeholder="email@example.com"
            />

          </div>

          {/* PASSWORD */}

          <div>

            <label
              className="
                block
                text-sm
                font-medium
                mb-2
              "
            >
              Password
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={e =>
                setPassword(
                  e.target.value
                )
              }
              className="
                w-full
                border
                rounded-xl
                px-4
                py-3
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
              placeholder="********"
            />

          </div>

          {/* BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              bg-blue-600
              hover:bg-blue-700
              disabled:opacity-50
              text-white
              rounded-xl
              py-3
              font-medium
              transition
            "
          >

            {
              loading
                ? 'Loading...'
                : 'Masuk'
            }

          </button>

        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Belum punya akun?{' '}
          <Link href="/daftar" className="text-blue-600 hover:underline font-medium">
            Daftar
          </Link>
        </p>

        <p className="text-center text-sm text-gray-500 mt-2">
          Punya undangan tapi link tidak valid?{' '}
          <Link href="/aktivasi/minta-link" className="text-blue-600 hover:underline font-medium">
            Minta link baru
          </Link>
        </p>

      </div>

    </div>
  )
}