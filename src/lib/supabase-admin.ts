// This file is not currently used in the codebase
// Admin authentication is handled directly in the page components
// Keeping this file for potential future use

import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client with auth
export function createClientClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
