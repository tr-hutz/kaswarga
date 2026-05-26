import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL

const supabaseAnonKey =
  process.env
    .NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createBrowserClient(
  'https://bftwjxpotkmpofdruiqc.supabase.co',
  'sb_publishable_9S7keXBfOvJqzVOBRIxK4w_pjQ2UhXt'
);