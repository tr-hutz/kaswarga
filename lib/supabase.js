import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
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