import './globals.css'
import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { AuthProvider }  from '../lib/auth/AuthProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import AppShell          from '../components/layout/AppShell'
import ToastProvider     from '../components/ui/ToastProvider'
import DialogProvider    from '../components/ui/DialogProvider'

export const metadata: Metadata = {
  title: {
    template: '%s | KasWarga',
    default:  'KasWarga',
  },
}

const outfit = Outfit({
  subsets:  ['latin'],
  variable: '--font-outfit',
})

// Reads localStorage before React hydrates — prevents flash of wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem('kaswarga-theme')||'system';if(t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages()

  return (
    <html lang="id" className={outfit.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans">
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  )
}
