import './globals.css'

import {

  AuthProvider

} from '../lib/auth/AuthProvider'

import AppShell

  from '../components/layout/AppShell'

export default function RootLayout({

                                     children

                                   }) {

  return (

      <html lang="id">

      <body>

      <AuthProvider>

        <AppShell>

          {children}

        </AppShell>

      </AuthProvider>

      </body>

      </html>
  )
}