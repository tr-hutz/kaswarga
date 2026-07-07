import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../types/database'

export const supabase = createBrowserClient<Database>(
  'https://bftwjxpotkmpofdruiqc.supabase.co',
  'sb_publishable_9S7keXBfOvJqzVOBRIxK4w_pjQ2UhXt',
  {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);