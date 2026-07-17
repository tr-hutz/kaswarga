import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL      || ''
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY     || ''

export const supabaseAdmin = createClient<Database>(
    SUPABASE_URL,
    SERVICE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession:   false
        }
    }
)
