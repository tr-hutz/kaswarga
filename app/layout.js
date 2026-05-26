import './globals.css'

import AppLayout
  from '../components/layout/AppLayout'

export const metadata = {

  title:
    'Kas Wargi',

  description:
    'Sistem Iuran Warga'

}

export default function RootLayout({
  children
}) {

  return (

    <html lang="id">

      <body>

        <AppLayout>

          {children}

        </AppLayout>

      </body>

    </html>
  )
}