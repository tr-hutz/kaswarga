import { defineConfig } from 'vitest/config'
import path             from 'path'

export default defineConfig({
  test: {
    environment: 'node',

    // Fake env vars so Supabase client modules initialize without throwing.
    // Real credentials are never used — unit tests inject mock clients.
    env: {
      NEXT_PUBLIC_SUPABASE_URL:      'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY:     'test-service-key',
    },

    include:  ['lib/**/__tests__/**/*.test.ts'],
    exclude:  ['node_modules', 'e2e', '.next'],
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
