import './globals.css'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { AuthProvider } from '../lib/auth/AuthProvider'
import AppShell from '../components/layout/AppShell'
import ToastProvider from '../components/ui/ToastProvider'
import DialogProvider from '../components/ui/DialogProvider'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages()

  return (
    <html lang="id">
      <body>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <ToastProvider>
              <DialogProvider>
                <AppShell>
                  {children}
                </AppShell>
              </DialogProvider>
            </ToastProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
