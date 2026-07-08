// @ts-nocheck
'use client'

import Link from 'next/link'
import { LogIn } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function LoginView({

  loading,

  email,
  setEmail,

  password,
  setPassword,

  error,

  handleSubmit

}) {

  const t = useTranslations('auth')

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
            {t('title')}
          </h1>

          <p
            className="
              text-sm
              text-gray-500
              mt-2
            "
          >
            {t('subtitle')}
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
              {t('email')}
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
              placeholder={t('emailPlaceholder')}
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
              {t('password')}
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
              placeholder={t('passwordPlaceholder')}
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
                ? t('loading')
                : t('submit')
            }

          </button>

        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('noAccount')}{' '}
          <Link href="/daftar" className="text-blue-600 hover:underline font-medium">
            {t('register')}
          </Link>
        </p>

        <p className="text-center text-sm text-gray-500 mt-2">
          {t('hasInvitation')}{' '}
          <Link href="/activation/minta-link" className="text-blue-600 hover:underline font-medium">
            {t('requestNewLink')}
          </Link>
        </p>

      </div>

    </div>
  )
}