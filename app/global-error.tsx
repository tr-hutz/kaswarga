'use client'

// Root-layout error boundary — cannot use next-intl, Tailwind, or any
// provider that lives in app/layout.tsx (which may have crashed).
// Inline styles are intentional.
export default function GlobalError({
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html lang="id">
            <body style={{ margin: 0, fontFamily: 'sans-serif' }}>
                <div style={{
                    display:         'flex',
                    flexDirection:   'column',
                    alignItems:      'center',
                    justifyContent:  'center',
                    minHeight:       '100vh',
                    textAlign:       'center',
                    padding:         '1rem',
                    backgroundColor: '#F1F5F9',
                }}>
                    <p style={{ fontSize: '4rem', fontWeight: 'bold', color: '#E2E8F0', marginBottom: '1rem' }}>!</p>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1C2434', marginBottom: '0.5rem' }}>
                        Terjadi Kesalahan
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: '#637381', marginBottom: '1.5rem' }}>
                        Halaman tidak dapat dimuat. Silakan coba lagi.
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            padding:         '0.5rem 1rem',
                            backgroundColor: '#3C50E0',
                            color:           'white',
                            border:          'none',
                            borderRadius:    '0.5rem',
                            fontSize:        '0.875rem',
                            cursor:          'pointer',
                        }}
                    >
                        Coba Lagi
                    </button>
                </div>
            </body>
        </html>
    )
}
