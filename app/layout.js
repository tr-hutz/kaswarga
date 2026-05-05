import './globals.css'
import Navbar from '../components/Navbar'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>

        {/* Navbar global */}
        <Navbar />

        <div className="p-4 max-w-4xl mx-auto">
          {children}
        </div>

      </body>
    </html>
  )
}