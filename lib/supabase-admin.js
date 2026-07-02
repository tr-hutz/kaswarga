import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL      || 'https://bftwjxpotkmpofdruiqc.supabase.co'
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY      || 'missing-service-role-key'

export const supabaseAdmin = createClient(
    SUPABASE_URL,
    SERVICE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession:   false
        }
    }
)
