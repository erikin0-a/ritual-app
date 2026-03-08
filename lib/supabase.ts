import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (__DEV__ && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('[Supabase] Missing env vars — remote features disabled. Copy .env.example → .env')
}

// Client is always created; queries will fail gracefully if env is missing.
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})
