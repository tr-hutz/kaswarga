'use client'

import type { FormEvent } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import PasswordInput from '@/components/ui/PasswordInput'
import { useTranslations } from 'next-intl'

interface LoginViewProps {
  loading:      boolean
  email:        string
  setEmail:     (v: string) => void
  password:     string
  setPassword:  (v: string) => void
  error:        string
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void
}

export default function LoginView({

  loading,

  email,
  setEmail,

  password,
  setPassword,

  error,

  handleSubmit

}: LoginViewProps) {

  const t = useTranslations('auth')

  return (

    <div
      className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-canvas
        px-4
      "
    >

      <div
        className="
          w-full
          max-w-md
          bg-surface
          rounded-xl
          shadow-card
          border
          border-divider
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
              rounded-xl
              bg-primary/10
              text-primary
              mb-4
            "
          >

            <Icon name="log-in" size={28} />

          </div>

          <h1
            className="
              text-2xl
              font-bold
              text-foreground
            "
          >
            {t('title')}
          </h1>

          <p
            className="
              text-sm
              text-muted
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
                bg-danger/5
                border
                border-danger/30
                text-danger
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
                border-divider
                rounded-lg
                px-4
                py-3
                outline-none
                focus:ring-2
                focus:ring-primary/30
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

            <PasswordInput
              required
              value={password}
              onChange={e =>
                setPassword(
                  e.target.value
                )
              }
              className="
                border
                border-divider
                rounded-lg
                px-4
                py-3
                outline-none
                focus:ring-2
                focus:ring-primary/30
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
              bg-primary
              hover:bg-primary-dark
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

        <p className="text-center text-sm text-muted mt-6">
          {t('noAccount')}{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">
            {t('register')}
          </Link>
        </p>

        <p className="text-center text-sm text-muted mt-2">
          {t('hasInvitation')}{' '}
          <Link href="/activation/request-link" className="text-primary hover:underline font-medium">
            {t('requestNewLink')}
          </Link>
        </p>

      </div>

    </div>
  )
}