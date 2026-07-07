// @ts-nocheck
import './globals.css'

import {

  AuthProvider

} from '../lib/auth/AuthProvider'

import AppShell

  from '../components/layout/AppShell'

import ToastProvider

  from '../components/ui/ToastProvider'

import DialogProvider

  from '../components/ui/DialogProvider'

export default function RootLayout({

                                     children

                                   }) {

  return (

      <html lang="id">

      <body>

      <AuthProvider>

        <ToastProvider>

        <DialogProvider>

          <AppShell>

            {children}

          </AppShell>

        </DialogProvider>

        </ToastProvider>

      </AuthProvider>

      </body>

      </html>
  )
}